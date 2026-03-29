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

var s3Client *s3.Client
var bucketName string

func InitS3() {
	endpoint := os.Getenv("S3_ENDPOINT")
	accessKey := os.Getenv("S3_ACCESS_KEY")
	secretKey := os.Getenv("S3_SECRET_KEY")
	bucketName = os.Getenv("S3_BUCKET")
	region := os.Getenv("S3_REGION")

	if endpoint == "" || accessKey == "" || secretKey == "" {
		fmt.Println("S3 configuration missing, media uploads will fail.")
		return
	}

	customResolver := aws.EndpointResolverWithOptionsFunc(func(service, region string, options ...interface{}) (aws.Endpoint, error) {
		return aws.Endpoint{
			URL:               endpoint,
			HostnameImmutable: true,
		}, nil
	})

	cfg, err := config.LoadDefaultConfig(context.TODO(),
		config.WithRegion(region),
		config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(accessKey, secretKey, "")),
		config.WithEndpointResolverWithOptions(customResolver),
	)
	if err != nil {
		fmt.Printf("Unable to load SDK config, %v\n", err)
		return
	}

	s3Client = s3.NewFromConfig(cfg)
	fmt.Println("S3/R2 client initialized successfully.")
}

func UploadToS3(ctx context.Context, reader io.Reader, filename string, contentType string) (string, error) {
	if s3Client == nil {
		return "", fmt.Errorf("S3 client not initialized")
	}

	// Create a unique key
	key := fmt.Sprintf("whatsapp/%d_%s", time.Now().Unix(), filename)

	_, err := s3Client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(bucketName),
		Key:         aws.String(key),
		Body:        reader,
		ContentType: aws.String(contentType),
	})
	if err != nil {
		return "", err
	}

	// Construct the public URL (this varies by provider, but usually it's [endpoint]/[bucket]/[key]
	// reflect Cloudflare R2 structure if applicable: https://[accountid].r2.cloudflarestorage.com/[bucket]/[key]
	// Or often a custom domain. We'll return a path that the frontend can use.
	// For R2, sometimes the endpoint itself is the base.
	return fmt.Sprintf("%s/%s/%s", os.Getenv("S3_ENDPOINT"), bucketName, key), nil
}
