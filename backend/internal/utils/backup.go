package utils

import (
	"context"
	"fmt"
	"log"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"real_estate_crm/internal/repository"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/feature/s3/transfermanager"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

func UpdateBackupStatus(status string, err error) {
	timestamp := time.Now().Format(time.RFC3339)
	val := timestamp
	if err != nil {
		val = fmt.Sprintf("%s | Error: %v", timestamp, err)
	}

	_, _ = repository.DB.Exec(context.Background(),
		"INSERT INTO automation_settings (key, value) VALUES ('last_backup_status', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
		status)
	_, _ = repository.DB.Exec(context.Background(),
		"INSERT INTO automation_settings (key, value) VALUES ('last_backup_time', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
		val)
}

// RunBackup generates a pg_dump and returns the filename
func RunBackup() (string, error) {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		return "", fmt.Errorf("DATABASE_URL not set")
	}

	timestamp := time.Now().Format("2006-01-02_15-04-05")
	tempFile := filepath.Join(os.TempDir(), fmt.Sprintf("backup_%s.sql", timestamp))

	// In Docker, we need to pass the password via PGPASSWORD if it's not in the URL,
	// but our DATABASE_URL usually has it.
	cmd := exec.Command("pg_dump", dbURL, "-f", tempFile, "--no-owner", "--no-privileges")

	output, err := cmd.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("pg_dump failed: %v, output: %s", err, string(output))
	}

	return tempFile, nil
}

// UploadToS3 uploads a file to the configured S3 bucket using the modern TransferManager
func UploadToS3(filePath string) error {
	bucket := os.Getenv("S3_BUCKET")
	accessKey := os.Getenv("S3_ACCESS_KEY")
	secretKey := os.Getenv("S3_SECRET_KEY")
	endpoint := os.Getenv("S3_ENDPOINT")
	region := os.Getenv("S3_REGION")

	// 0. Smart Parsing: If endpoint looks like https://host/bucket, split them
	if strings.Contains(endpoint, ".com/") || strings.Contains(endpoint, ".net/") {
		u, err := url.Parse(endpoint)
		if err == nil && u.Path != "" && u.Path != "/" {
			bucket = strings.TrimPrefix(u.Path, "/")
			endpoint = fmt.Sprintf("%s://%s", u.Scheme, u.Host)
		}
	}

	if bucket == "" || accessKey == "" || secretKey == "" {
		return fmt.Errorf("S3 is not fully configured (Bucket/Access/Secret missing)")
	}

	// 1. Prepare Configuration
	cfg, err := config.LoadDefaultConfig(context.TODO(),
		config.WithRegion(region),
		config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(accessKey, secretKey, "")),
	)
	if err != nil {
		return fmt.Errorf("failed to load SDK config: %v", err)
	}

	// 2. Initialize S3 Client (supports custom endpoint for DigitalOcean/Minio)
	s3Client := s3.NewFromConfig(cfg, func(o *s3.Options) {
		if endpoint != "" {
			o.BaseEndpoint = aws.String(endpoint)
		}
	})

	// 3. Open local file
	file, err := os.Open(filePath)
	if err != nil {
		return fmt.Errorf("failed to open backup file: %v", err)
	}
	defer file.Close()

	// 4. Determine S3 key (filename)
	fileName := filepath.Base(filePath)
	s3Key := fmt.Sprintf("backups/%s", fileName)

	// 5. Initialize Transfer Manager (modern uploader)
	tmClient := transfermanager.New(s3Client)

	log.Printf("Starting S3 upload to %s/%s using TransferManager...", bucket, s3Key)

	// Use UploadObject instead of previous manager.Uploader
	_, err = tmClient.UploadObject(context.TODO(), &transfermanager.UploadObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(s3Key),
		Body:   file,
	})

	if err != nil {
		return fmt.Errorf("failed to upload to S3: %v", err)
	}

	log.Printf("Successfully uploaded backup to S3.")
	return nil
}

func CleanUp(filePath string) {
	_ = os.Remove(filePath)
}

// StartAutoBackup initiates the background daily backup routine
func StartAutoBackup() {
	go func() {
		for {
			log.Println("Next daily backup in 24 hours...")
			time.Sleep(24 * time.Hour)

			log.Println("Starting automated daily backup...")
			path, err := RunBackup()
			if err != nil {
				log.Printf("Auto-backup failed (DUMP): %v", err)
				UpdateBackupStatus("failed", err)
				continue
			}

			err = UploadToS3(path)
			if err != nil {
				log.Printf("Auto-backup failed (UPLOAD): %v", err)
				UpdateBackupStatus("failed", err)
			} else {
				UpdateBackupStatus("success", nil)
			}

			CleanUp(path)
		}
	}()
}
