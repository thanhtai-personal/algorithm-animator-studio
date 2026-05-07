export type MediaAssetType = "image" | "video";

export interface MediaUsageDto {
  usedBytes: number;
  reservedBytes: number;
  limitBytes: number;
  remainingBytes: number;
  usageRatio: number;
  isFull: boolean;
  warning: boolean;
}

export interface MediaAssetDto {
  id: string;
  branchId: string;
  bucket: string;
  storagePath: string;
  publicUrl: string;
  mediaType: MediaAssetType;
  mimeType: string;
  sizeBytes: number;
  originalFileName: string | null;
  createdAt: string;
}

export interface MediaListQuery {
  branchId?: string | null;
  search?: string | null;
  mediaType?: MediaAssetType | null;
  page?: number;
  pageSize?: number;
}

export interface MediaListResponse {
  branchId: string;
  items: MediaAssetDto[];
  total: number;
  page: number;
  pageSize: number;
  usage: MediaUsageDto;
}

export interface PrepareMediaUploadPayload {
  branchId?: string | null;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  mediaType: MediaAssetType;
}

export interface PrepareMediaUploadResponse {
  uploadSessionId: string;
  branchId: string;
  bucket: string;
  storagePath: string;
  mediaType: MediaAssetType;
  usage: MediaUsageDto;
}

export interface CompleteMediaUploadPayload {
  uploadSessionId: string;
}

export interface CompleteMediaUploadResponse {
  asset: MediaAssetDto;
  usage: MediaUsageDto;
}

export interface DeleteMediaResponse {
  success: true;
  usage: MediaUsageDto;
}
