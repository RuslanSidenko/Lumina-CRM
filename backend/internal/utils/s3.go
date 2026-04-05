package utils

import (
	"context"
	"fmt"
	"io"
	"os"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

var globalS3Client *s3.Client
var minioClient *s3.Client

var globalBucketName string
var minioBucketName string

func InitS3() {
	// Initialize Global Cloud S3 (e.g. R2)
	initGlobalS3()
	// Initialize Local MinIO (with smart defaults)
	initMinio()
}

func initGlobalS3() {
	endpoint := os.Getenv("S3_ENDPOINT")
	accessKey := os.Getenv("S3_ACCESS_KEY")
	secretKey := os.Getenv("S3_SECRET_KEY")
	globalBucketName = os.Getenv("S3_BUCKET")
	region := os.Getenv("S3_REGION")

	if endpoint == "" || accessKey == "" || secretKey == "" {
		return
	}

	customResolver := aws.EndpointResolverWithOptionsFunc(func(service, region string, options ...interface{}) (aws.Endpoint, error) {
		return aws.Endpoint{URL: endpoint, HostnameImmutable: true}, nil
	})

	cfg, _ := config.LoadDefaultConfig(context.TODO(),
		config.WithRegion(region),
		config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(accessKey, secretKey, "")),
		config.WithEndpointResolverWithOptions(customResolver),
	)
	globalS3Client = s3.NewFromConfig(cfg)
	fmt.Println("Global S3 client initialized.")
}

func initMinio() {
	// SMART DEFAULTS (No .env required for local dev)
	endpoint := os.Getenv("MINIO_ENDPOINT")
	if endpoint == "" {
		// Use standard port 9550 (as per docker-compose)
		// We use localhost if on host, or 'minio' jika dalam docker network
		endpoint = "http://localhost:9550" 
	}
	
	accessKey := os.Getenv("MINIO_ACCESS_KEY")
	if accessKey == "" { accessKey = "minioadmin" }

	secretKey := os.Getenv("MINIO_SECRET_KEY")
	if secretKey == "" { secretKey = "minioadmin" }

	minioBucketName = os.Getenv("MINIO_BUCKET")
	if minioBucketName == "" { minioBucketName = "whatsapp" }

	region := os.Getenv("MINIO_REGION")
	if region == "" { region = "us-east-1" }

	customResolver := aws.EndpointResolverWithOptionsFunc(func(service, region string, options ...interface{}) (aws.Endpoint, error) {
		return aws.Endpoint{URL: endpoint, HostnameImmutable: true}, nil
	})

	cfg, _ := config.LoadDefaultConfig(context.TODO(),
		config.WithRegion(region),
		config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(accessKey, secretKey, "")),
		config.WithEndpointResolverWithOptions(customResolver),
	)
	minioClient = s3.NewFromConfig(cfg)
	fmt.Printf("MinIO client initialized with endpoint %s\n", endpoint)

	// Auto-create bucket
	_, _ = minioClient.CreateBucket(context.Background(), &s3.CreateBucketInput{
		Bucket: aws.String(minioBucketName),
	})
}

// UploadToS3 uploads to the provider specified by WHATSAPP_STORAGE_PROVIDER (default: minio)
func UploadToS3(ctx context.Context, reader io.Reader, filename string, contentType string) (string, error) {
	provider := os.Getenv("WHATSAPP_STORAGE_PROVIDER")
	
	if provider == "s3" && globalS3Client != nil {
		fmt.Println("Using Cloud S3 for storage.")
		return uploadTo(ctx, globalS3Client, globalBucketName, os.Getenv("S3_ENDPOINT"), reader, filename, contentType)
	}

	if minioClient != nil {
		fmt.Println("Using local MinIO for storage.")
		
		// If using Minio by default, we use the local endpoint from env or default
		endpoint := os.Getenv("MINIO_ENDPOINT")
		if endpoint == "" { endpoint = "http://localhost:9550" }

		return uploadTo(ctx, minioClient, minioBucketName, endpoint, reader, filename, contentType)
	}

	return "", fmt.Errorf("no storage provider configured or available")
}

func uploadTo(ctx context.Context, client *s3.Client, bucket, endpointURL string, reader io.Reader, filename, contentType string) (string, error) {
	key := fmt.Sprintf("whatsapp/%d_%s", time.Now().Unix(), filename)

	_, err := client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(bucket),
		Key:         aws.String(key),
		Body:        reader,
		ContentType: aws.String(contentType),
	})
	if err != nil {
		return "", err
	}

	return fmt.Sprintf("%s/%s/%s", endpointURL, bucket, key), nil
}
