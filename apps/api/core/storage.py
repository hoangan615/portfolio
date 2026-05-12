from __future__ import annotations

import mimetypes
import uuid
from pathlib import PurePosixPath
from typing import BinaryIO

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

from core.config import settings


class StorageClient:
    """Thin wrapper around boto3 S3 / MinIO client."""

    def __init__(self) -> None:
        self._client = boto3.client(
            "s3",
            endpoint_url=settings.S3_ENDPOINT_URL,
            aws_access_key_id=settings.S3_ACCESS_KEY_ID,
            aws_secret_access_key=settings.S3_SECRET_ACCESS_KEY,
            region_name=settings.S3_REGION,
            config=Config(signature_version="s3v4"),
        )
        self.bucket = settings.S3_BUCKET_NAME
        self.public_url = settings.S3_PUBLIC_URL.rstrip("/")

    # ── Bucket management ─────────────────────────────────────────────────────

    def ensure_bucket(self) -> None:
        try:
            self._client.head_bucket(Bucket=self.bucket)
        except ClientError:
            self._client.create_bucket(Bucket=self.bucket)
            # Make bucket public-read for media serving
            self._client.put_bucket_policy(
                Bucket=self.bucket,
                Policy=(
                    '{"Version":"2012-10-17","Statement":[{"Effect":"Allow",'
                    '"Principal":"*","Action":"s3:GetObject",'
                    f'"Resource":"arn:aws:s3:::{self.bucket}/*"}}]}}'
                ),
            )

    # ── Upload ────────────────────────────────────────────────────────────────

    def upload_fileobj(
        self,
        file_obj: BinaryIO,
        key: str,
        content_type: str | None = None,
        extra_args: dict | None = None,
    ) -> str:
        """Upload a file-like object and return its public URL."""
        ct = content_type or "application/octet-stream"
        args = {"ContentType": ct, **(extra_args or {})}
        self._client.upload_fileobj(file_obj, self.bucket, key, ExtraArgs=args)
        return self.get_url(key)

    def upload_bytes(self, data: bytes, key: str, content_type: str = "application/octet-stream") -> str:
        import io
        return self.upload_fileobj(io.BytesIO(data), key, content_type)

    # ── Download / URL ────────────────────────────────────────────────────────

    def get_url(self, key: str) -> str:
        return f"{self.public_url}/{key}"

    def generate_presigned_upload_url(
        self,
        key: str,
        content_type: str,
        expires_in: int = 3600,
    ) -> dict[str, str]:
        """Return a presigned POST URL for direct browser uploads."""
        response = self._client.generate_presigned_post(
            self.bucket,
            key,
            Fields={"Content-Type": content_type},
            Conditions=[{"Content-Type": content_type}],
            ExpiresIn=expires_in,
        )
        return response

    def generate_presigned_get_url(self, key: str, expires_in: int = 3600) -> str:
        return self._client.generate_presigned_url(
            "get_object",
            Params={"Bucket": self.bucket, "Key": key},
            ExpiresIn=expires_in,
        )

    # ── Delete ────────────────────────────────────────────────────────────────

    def delete_object(self, key: str) -> None:
        self._client.delete_object(Bucket=self.bucket, Key=key)

    def delete_objects(self, keys: list[str]) -> None:
        if not keys:
            return
        self._client.delete_objects(
            Bucket=self.bucket,
            Delete={"Objects": [{"Key": k} for k in keys]},
        )

    # ── Helpers ───────────────────────────────────────────────────────────────

    @staticmethod
    def build_key(folder: str, filename: str, user_id: str | uuid.UUID | None = None) -> str:
        uid_part = f"{user_id}/" if user_id else ""
        stem = PurePosixPath(filename).stem
        ext = PurePosixPath(filename).suffix
        unique = uuid.uuid4().hex
        return f"{folder}/{uid_part}{stem}_{unique}{ext}"


storage = StorageClient()
