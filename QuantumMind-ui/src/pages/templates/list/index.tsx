// ** React Imports
import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

// ** MUI Imports
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Pagination from '@mui/material/Pagination';
import Select, { SelectChangeEvent } from '@mui/material/Select';

// ** Store & Actions
import { AppDispatch, RootState } from 'src/store';
import {
  duplicateTemplate,
  fetchTemplateParams,
  fetchTemplates,
  publishTemplate,
  unpublishTemplate,
} from 'src/store/apps/template';

// ** Components
import AddTemplateDrawer from 'src/views/templates/AddTemplateDrawer';
import DeleteTemplateDialog from 'src/views/templates/DeleteTemplateDialog';
import EditTemplateDrawer from 'src/views/templates/EditTemplateDrawer';
import TableHeader from 'src/views/templates/TableHeader';
import TemplateCard from 'src/views/templates/TemplateCard';
import TemplateEmptyState from 'src/views/templates/TemplateEmptyState';
import TemplatePreviewModal from 'src/views/templates/TemplatePreviewModal';

// ** Utils
import { humanize } from 'src/views/templates/utils';

const PER_PAGE = 12;

const Templates = () => {
  const dispatch = useDispatch<AppDispatch>();

  // ** Store
  const templateStore = useSelector(
    (state: RootState) => state.template.templateListData,
  );
  const templateParams = useSelector(
    (state: RootState) => state.template.templateParams,
  );
  const loading = useSelector((state: RootState) => state.template.loading);

  // ** Filter state
  const [value, setValue] = useState<string>('');
  const [industry, setIndustry] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [page, setPage] = useState<number>(0);

  // ** Drawer / dialog state
  const [addOpen, setAddOpen] = useState<boolean>(false);
  const [editOpen, setEditOpen] = useState<boolean>(false);
  const [deleteOpen, setDeleteOpen] = useState<boolean>(false);
  const [selectedId, setSelectedId] = useState<string>('');

  // ** Preview state
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [previewName, setPreviewName] = useState<string>('');
  const [previewOpen, setPreviewOpen] = useState<boolean>(false);

  const toggleAddDrawer = () => setAddOpen(!addOpen);
  const toggleEditDrawer = () => setEditOpen(!editOpen);

  const handleFilter = useCallback((val: string) => {
    setValue(val);
    setPage(0);
  }, []);

  useEffect(() => {
    dispatch(fetchTemplateParams());
  }, [dispatch]);

  useEffect(() => {
    dispatch(
      fetchTemplates({
        skip: page * PER_PAGE,
        limit: PER_PAGE,
        search: value,
        industry,
        category,
        status,
      }),
    );
  }, [dispatch, page, value, industry, category, status]);

  const count = Math.ceil((templateStore?.count || 0) / PER_PAGE);
  const hasData = templateStore?.data?.length > 0;
  const hasFilters = Boolean(value || industry || category || status);

  // ** Handlers
  const handlePreview = (item: any) => {
    if (!item?.hostedUrl) return;
    setPreviewUrl(item.hostedUrl);
    setPreviewName(item.name);
    setPreviewOpen(true);
  };

  const handleEdit = (id: string) => {
    setSelectedId(id);
    toggleEditDrawer();
  };

  const handleDelete = (id: string) => {
    setSelectedId(id);
    setDeleteOpen(true);
  };

  const handleDuplicate = (id: string) => {
    dispatch(duplicateTemplate(id));
  };

  const handleTogglePublish = (item: any) => {
    if (item?.status === 'published') {
      dispatch(unpublishTemplate(item.id));
    } else {
      dispatch(publishTemplate(item.id));
    }
  };

  return (
    <>
      <Grid container spacing={6}>
        <Grid item xs={12}>
          <Card>
            <TableHeader
              value={value}
              handleFilter={handleFilter}
              toggle={toggleAddDrawer}
            />
            <Divider sx={{ m: '0 !important' }} />
            <CardContent>
              <Grid container spacing={5}>
                <Grid item sm={3} xs={12}>
                  <div style={{ fontSize: '1.1rem' }}>Filters</div>
                </Grid>

                <Grid item sm={3} xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="industry-filter">Industry</InputLabel>
                    <Select
                      value={industry}
                      size="small"
                      label="Industry"
                      labelId="industry-filter"
                      onChange={(e: SelectChangeEvent) => {
                        setIndustry(e.target.value);
                        setPage(0);
                      }}
                    >
                      <MenuItem value="">All</MenuItem>
                      {templateParams?.industries?.map((item: string) => (
                        <MenuItem key={item} value={item}>
                          {humanize(item)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item sm={3} xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="category-filter">Category</InputLabel>
                    <Select
                      value={category}
                      size="small"
                      label="Category"
                      labelId="category-filter"
                      onChange={(e: SelectChangeEvent) => {
                        setCategory(e.target.value);
                        setPage(0);
                      }}
                    >
                      <MenuItem value="">All</MenuItem>
                      {templateParams?.categories?.map((item: string) => (
                        <MenuItem key={item} value={item}>
                          {humanize(item)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item sm={3} xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="status-filter">Status</InputLabel>
                    <Select
                      value={status}
                      size="small"
                      label="Status"
                      labelId="status-filter"
                      onChange={(e: SelectChangeEvent) => {
                        setStatus(e.target.value);
                        setPage(0);
                      }}
                    >
                      <MenuItem value="">All</MenuItem>
                      {templateParams?.statuses?.map((item: string) => (
                        <MenuItem key={item} value={item}>
                          {humanize(item)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Loading state */}
          {loading && (
            <Box
              sx={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                py: 12,
              }}
            >
              <CircularProgress />
            </Box>
          )}

          {/* Cards grid */}
          {!loading && hasData && (
            <Box
              sx={{
                width: '100%',
                p: 6,
                gap: 6,
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'flex-start',
                justifyContent: 'flex-start',
              }}
            >
              {templateStore.data.map((item: any) => (
                <TemplateCard
                  key={item.id}
                  item={item}
                  onPreview={handlePreview}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onDuplicate={handleDuplicate}
                  onTogglePublish={handleTogglePublish}
                />
              ))}
            </Box>
          )}

          {/* Empty / no-results states */}
          {!loading && !hasData && (
            <TemplateEmptyState
              variant={hasFilters ? 'no-results' : 'empty'}
              onUpload={toggleAddDrawer}
            />
          )}

          {/* Pagination */}
          {!loading && hasData && count > 1 && (
            <Box
              sx={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                py: 4,
              }}
            >
              <Pagination
                count={count}
                page={page + 1}
                color="primary"
                onChange={(_e, p) => setPage(p - 1)}
              />
            </Box>
          )}
        </Grid>
      </Grid>

      <AddTemplateDrawer open={addOpen} toggle={toggleAddDrawer} />
      <EditTemplateDrawer
        templateId={selectedId}
        open={editOpen}
        toggle={toggleEditDrawer}
      />
      <DeleteTemplateDialog
        templateId={selectedId}
        open={deleteOpen}
        setOpen={setDeleteOpen}
      />
      <TemplatePreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        url={previewUrl}
        name={previewName}
      />
    </>
  );
};

export default Templates;
