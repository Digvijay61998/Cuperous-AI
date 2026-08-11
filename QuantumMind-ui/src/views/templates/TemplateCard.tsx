// ** MUI Imports
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

// ** Icon Imports
import Icon from 'src/@core/components/icon';

// ** Components
import TemplateStatusBadge from './TemplateStatusBadge';
import TemplateVersionBadge from './TemplateVersionBadge';

// ** Utils
import { ellipsify, formatDate, humanize } from './utils';

interface Props {
  item: any;
  onPreview: (item: any) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onTogglePublish: (item: any) => void;
}

const TemplateCard = (props: Props) => {
  const { item, onPreview, onEdit, onDelete, onDuplicate, onTogglePublish } =
    props;

  const isPublished = item?.status === 'published';

  return (
    <Card
      sx={{
        width: 345,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px',
      }}
    >
      {/* Thumbnail */}
      <Box
        sx={{
          height: 160,
          position: 'relative',
          backgroundColor: 'action.hover',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          cursor: 'pointer',
        }}
        onClick={() => onPreview(item)}
      >
        {item?.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.thumbnail}
            alt={item?.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <Icon icon="material-symbols-light:web-sharp" fontSize={64} />
        )}
        <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
          <TemplateStatusBadge status={item?.status} />
        </Box>
      </Box>

      <CardContent sx={{ flexGrow: 1, pb: 2 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 1,
            mb: 1,
          }}
        >
          <Typography
            sx={{ fontWeight: 'bold', fontSize: 15, lineHeight: 1.3 }}
            title={item?.name}
          >
            {item?.name}
          </Typography>
          <TemplateVersionBadge version={item?.currentVersion} />
        </Box>

        <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 0.5 }}>
          {item?.industry && (
            <Chip
              size="small"
              label={humanize(item.industry)}
              sx={{ fontSize: 11, backgroundColor: 'secondary.main', color: 'white' }}
            />
          )}
          {item?.category && (
            <Chip
              size="small"
              variant="outlined"
              label={humanize(item.category)}
              sx={{ fontSize: 11 }}
            />
          )}
        </Stack>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontSize: 12, lineHeight: 1.5, minHeight: 36 }}
        >
          {ellipsify(item?.description) || 'No description provided.'}
        </Typography>

        <Typography
          variant="caption"
          color="text.disabled"
          sx={{ display: 'block', mt: 1.5, fontSize: 11 }}
        >
          {item?.createdBy?.name ? `By ${item.createdBy.name} • ` : ''}
          {formatDate(item?.createdAt)}
        </Typography>
      </CardContent>

      <Divider sx={{ m: 0 }} />

      <CardActions sx={{ p: 1, justifyContent: 'space-between' }}>
        <Tooltip placement="top" title="Preview" arrow>
          <IconButton
            size="small"
            color="info"
            onClick={() => onPreview(item)}
            disabled={!item?.hostedUrl}
          >
            <Icon icon="bx:show" fontSize={20} />
          </IconButton>
        </Tooltip>

        <Tooltip placement="top" title="Edit" arrow>
          <IconButton size="small" color="primary" onClick={() => onEdit(item.id)}>
            <Icon icon="bxs:edit" fontSize={20} />
          </IconButton>
        </Tooltip>

        <Tooltip
          placement="top"
          title={isPublished ? 'Unpublish' : 'Publish'}
          arrow
        >
          <IconButton
            size="small"
            color={isPublished ? 'warning' : 'success'}
            onClick={() => onTogglePublish(item)}
          >
            <Icon
              icon={
                isPublished
                  ? 'material-symbols:block'
                  : 'material-symbols:check-circle-rounded'
              }
              fontSize={20}
            />
          </IconButton>
        </Tooltip>

        <Tooltip placement="top" title="Duplicate" arrow>
          <IconButton
            size="small"
            color="secondary"
            onClick={() => onDuplicate(item.id)}
          >
            <Icon icon="bx:copy" fontSize={20} />
          </IconButton>
        </Tooltip>

        <Tooltip placement="top" title="Delete" arrow>
          <IconButton size="small" color="error" onClick={() => onDelete(item.id)}>
            <Icon icon="bx:trash" fontSize={20} />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );
};

export default TemplateCard;
