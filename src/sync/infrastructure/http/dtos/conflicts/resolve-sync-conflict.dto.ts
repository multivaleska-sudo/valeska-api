import { IsIn, IsInt, IsObject, IsOptional, IsString } from 'class-validator';

export class ResolveSyncConflictDto {
    @IsIn(['ACCEPT_REMOTE', 'ACCEPT_LOCAL', 'MERGE'])
    strategy!: 'ACCEPT_REMOTE' | 'ACCEPT_LOCAL' | 'MERGE';

    @IsOptional()
    @IsObject()
    resolvedData?: Record<string, unknown>;

    @IsOptional()
    @IsInt()
    expectedRecordVersion?: number;

    @IsOptional()
    @IsString()
    resolutionNote?: string;
}