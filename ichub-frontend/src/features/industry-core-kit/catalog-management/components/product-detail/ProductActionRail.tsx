import { Box, Button, Divider, Typography } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import IosShareIcon from '@mui/icons-material/IosShare';
import { useTranslation } from 'react-i18next';
import { CardChip } from '@/features/industry-core-kit/catalog-management/components/product-list/CardChip';
import { PartType, StatusVariants } from '@/features/industry-core-kit/catalog-management/types/types';
import { CatalogPartTwinDetailsRead } from '@/features/industry-core-kit/catalog-management/types/twin-types';

interface ProductActionRailProps {
  part: PartType;
  twinDetails: CatalogPartTwinDetailsRead | null;
  isLoadingTwin: boolean;
  isRegistering: boolean;
  onRegister: () => void;
  onShare: () => void;
  onCopy: (text: string, fieldName: string) => void;
}

const formatUrn = (id?: string) => {
  if (!id) return undefined;
  return id.startsWith('urn:uuid:') ? id : `urn:uuid:${id}`;
};

const ProductActionRail = ({
  part,
  twinDetails,
  isLoadingTwin,
  isRegistering,
  onRegister,
  onShare,
  onCopy,
}: ProductActionRailProps) => {
  const { t } = useTranslation('catalogManagement');
  const { t: tCommon } = useTranslation('common');
  const status = part.status ?? StatusVariants.draft;
  const isRegisterable = status === StatusVariants.draft || status === StatusVariants.pending;
  const globalAssetId = formatUrn(twinDetails?.globalId);
  const aasId = formatUrn(twinDetails?.dtrAasId);
  const uniqueId = globalAssetId || `${part.manufacturerId}#${part.manufacturerPartId}`;

  const handleDownload = () => {
    const dataToDownload = {
      manufacturerId: part.manufacturerId,
      manufacturerPartId: part.manufacturerPartId,
      name: part.name,
      category: part.category,
      description: part.description,
      materials: part.materials,
      dimensions: {
        width: part.width,
        height: part.height,
        length: part.length,
        weight: part.weight,
      },
      status,
      customerPartIds: part.customerPartIds,
      ...(twinDetails && {
        twinDetails: {
          globalId: twinDetails.globalId,
          dtrAasId: twinDetails.dtrAasId,
          createdDate: twinDetails.createdDate,
          modifiedDate: twinDetails.modifiedDate,
        },
      }),
    };
    const fileName = `${part.name.toLowerCase().replace(/\s+/g, '-')}-catalog-data.json`;
    const url = URL.createObjectURL(new Blob([JSON.stringify(dataToDownload, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Box component="aside" className="product-action-rail" aria-label={tCommon('actions.title')}>
      <CardChip
        status={status}
        statusText={tCommon(`status.${status.toLowerCase()}`)}
        className={`product-action-rail-status${status === StatusVariants.shared || status === StatusVariants.pending ? ' black-status-chip' : ''}`}
      />

      <Button
        size="small"
        variant="outlined"
        className="actions-button product-action-primary"
        startIcon={isRegisterable ? <CloudUploadIcon /> : <IosShareIcon />}
        onClick={isRegisterable ? onRegister : onShare}
        disabled={isRegisterable && isRegistering}
      >
        {isRegisterable
          ? t('productDetail.shareDropdown.options.register')
          : t('productDetail.shareDropdown.options.share')}
      </Button>

      <Divider />
      <Typography className="product-action-rail-label" component="h2">
        {tCommon('actions.title')}
      </Typography>
      <Box className="product-action-rail-actions">
        <Button size="small" variant="outlined" className="product-action-secondary" startIcon={<FileDownloadIcon />} onClick={handleDownload}>
          {t('productDetail.shareDropdown.options.download')}
        </Button>
        <Button size="small" variant="outlined" className="product-action-secondary" startIcon={<ContentCopyIcon />} onClick={() => onCopy(uniqueId, globalAssetId ? tCommon('fields.globalAssetId') : tCommon('fields.partId').replace(/:$/, ''))}>
          {t('productDetail.shareDropdown.options.copy')}
        </Button>
        <Button size="small" variant="outlined" className="product-action-secondary" startIcon={<ContentCopyIcon />} disabled={!aasId || isLoadingTwin} onClick={() => aasId && onCopy(aasId, tCommon('fields.aasId'))}>
          {t('productDetail.shareDropdown.options.copyAasId')}
        </Button>
      </Box>
    </Box>
  );
};

export default ProductActionRail;