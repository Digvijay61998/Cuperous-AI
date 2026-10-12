// ** Board / list filters (crm-plugins-service-desk R12.2)
import { useEffect, useMemo, useRef, useState } from 'react';

import Autocomplete from '@mui/material/Autocomplete';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';

import Icon from 'src/@core/components/icon';
import Axios from 'src/helper/Axios';
import type { SrAssignee, SrStage } from 'src/store/apps/crm-service-requests';
import {
  activeFilterCount,
  AGE_OPTIONS,
  CATEGORY_OPTIONS,
  CHANNEL_OPTIONS,
  EMPTY_FILTERS,
  PRIORITY_OPTIONS,
  SOURCE_OPTIONS,
  SrFilters,
} from './srFilters';

interface Option {
  value: string;
  label: string;
}

interface Props {
  filters: SrFilters;
  onChange: (f: SrFilters) => void;
  stages: SrStage[];
  assignees: SrAssignee[];
  /** Bots and tags seen on the loaded requests (agents cannot list bots). */
  botOptions: Option[];
  tagOptions: string[];
  /** Name of the filtered contact when it is known from the loaded requests. */
  contactLabel?: string | null;
}

/** Multi-select over value/label options, values in the filters. */
const Multi = ({
  label,
  options,
  value,
  onChange,
  width = 200,
}: {
  label: string;
  options: Option[];
  value: string[];
  onChange: (v: string[]) => void;
  width?: number;
}) => {
  const byValue = useMemo(() => new Map(options.map((o) => [o.value, o])), [options]);
  const selected = value.map((v) => byValue.get(v) ?? { value: v, label: v });
  return (
    <Autocomplete
      multiple
      size="small"
      limitTags={1}
      options={options}
      value={selected}
      disableCloseOnSelect
      isOptionEqualToValue={(a, b) => a.value === b.value}
      getOptionLabel={(o) => o.label}
      onChange={(_e, v) => onChange(v.map((o) => o.value))}
      renderInput={(p) => <TextField {...p} label={label} placeholder={value.length ? '' : 'Any'} />}
      sx={{ width }}
    />
  );
};

const SrFiltersBar = ({ filters, onChange, stages, assignees, botOptions, tagOptions, contactLabel }: Props) => {
  const [more, setMore] = useState(false);
  const [q, setQ] = useState(filters.q || '');
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const set = (patch: Partial<SrFilters>) => onChange({ ...filters, ...patch });
  // The debounced search must not undo a filter changed while it waited.
  const latest = useRef(filters);
  latest.current = filters;

  // Keep the box in step with the address (back button, saved view).
  useEffect(() => setQ(filters.q || ''), [filters.q]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const typeSearch = (v: string) => {
    setQ(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const t = v.trim().slice(0, 200);
      const f = latest.current;
      if (t !== (f.q || '')) onChange({ ...f, q: t || undefined });
    }, 400);
  };

  const assigneeOptions: Option[] = [
    { value: 'me', label: 'Me' },
    { value: 'unassigned', label: 'Unassigned' },
    ...assignees.map((a) => ({ value: a.id, label: a.name || a.email || a.id })),
  ];
  const stageOptions = stages.map((s) => ({ value: s.id, label: s.name }));
  const priorityOptions = PRIORITY_OPTIONS.map((p) => ({ value: p, label: p[0] + p.slice(1).toLowerCase() }));
  const extra = activeFilterCount({
    ...filters,
    assignee: [],
    stageId: [],
    priority: [],
    emergency: false,
    q: undefined,
  });

  // Contact search for the contact filter (any org user may search contacts).
  const [contactOpts, setContactOpts] = useState<Option[]>([]);
  const [contactInput, setContactInput] = useState('');
  useEffect(() => {
    if (!more || contactInput.trim().length < 2) return;
    let live = true;
    const t = setTimeout(async () => {
      try {
        const r = await Axios.get('crm/contacts', { params: { q: contactInput.trim(), page: 1, pageSize: 10 } });
        const rows: any[] = r.data?.data || [];
        if (live) {
          setContactOpts(
            rows.map((c) => ({
              value: c.id || c._id,
              label: [c.firstName, c.lastName].filter(Boolean).join(' ') || c.email || c.phone || 'Unnamed contact',
            })),
          );
        }
      } catch {
        if (live) setContactOpts([]);
      }
    }, 300);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [contactInput, more]);

  const contactValue = filters.contactId ? { value: filters.contactId, label: contactLabel || 'Selected contact' } : null;

  return (
    <Box sx={{ px: 5, py: 3 }}>
      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small"
          value={q}
          onChange={(e) => typeSearch(e.target.value)}
          placeholder="Search ref, subject, contact"
          inputProps={{ 'aria-label': 'Search requests' }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Icon icon="bx:search" fontSize={18} />
              </InputAdornment>
            ),
          }}
          sx={{ width: 260 }}
        />
        <Multi
          label="Assignee"
          options={assigneeOptions}
          value={filters.assignee.filter((a) => a !== 'any')}
          onChange={(v) => set({ assignee: v })}
          width={220}
        />
        <Multi label="Stage" options={stageOptions} value={filters.stageId} onChange={(v) => set({ stageId: v })} />
        <Multi label="Priority" options={priorityOptions} value={filters.priority} onChange={(v) => set({ priority: v })} width={180} />
        <FormControlLabel
          control={<Switch size="small" checked={filters.emergency} onChange={(e) => set({ emergency: e.target.checked })} />}
          label="Emergency only"
        />
        <Badge badgeContent={extra} color="primary" invisible={!extra}>
          <Button
            size="small"
            variant={more ? 'contained' : 'outlined'}
            onClick={() => setMore((m) => !m)}
            aria-expanded={more}
            startIcon={<Icon icon="bx:filter-alt" />}
          >
            More filters
          </Button>
        </Badge>
        {activeFilterCount(filters) > 0 && (
          <Button size="small" onClick={() => onChange({ ...EMPTY_FILTERS })} startIcon={<Icon icon="bx:x" />}>
            Clear all
          </Button>
        )}
      </Box>

      <Collapse in={more}>
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center', pt: 3 }}>
          <Multi label="Category" options={CATEGORY_OPTIONS} value={filters.category} onChange={(v) => set({ category: v })} />
          <Multi label="Bot" options={botOptions} value={filters.botId} onChange={(v) => set({ botId: v })} />
          <Multi label="Channel" options={CHANNEL_OPTIONS} value={filters.channel} onChange={(v) => set({ channel: v })} />
          <Multi label="Source" options={SOURCE_OPTIONS} value={filters.source} onChange={(v) => set({ source: v })} />
          <Autocomplete
            size="small"
            options={contactOpts}
            value={contactValue}
            filterOptions={(x) => x}
            isOptionEqualToValue={(a, b) => a.value === b.value}
            getOptionLabel={(o) => o.label}
            onInputChange={(_e, v) => setContactInput(v)}
            onChange={(_e, v) => set({ contactId: v?.value || undefined })}
            noOptionsText={contactInput.trim().length < 2 ? 'Type 2 or more letters' : 'No contacts found'}
            renderInput={(p) => <TextField {...p} label="Contact" />}
            sx={{ width: 220 }}
          />
          <Autocomplete
            multiple
            freeSolo
            size="small"
            limitTags={1}
            options={tagOptions}
            value={filters.tags}
            onChange={(_e, v) => set({ tags: (v as string[]).map((t) => t.trim()).filter(Boolean) })}
            renderInput={(p) => <TextField {...p} label="Tags" placeholder={filters.tags.length ? '' : 'Any'} />}
            sx={{ width: 200 }}
          />
          <DateRange
            label="Created"
            from={filters.createdFrom}
            to={filters.createdTo}
            onChange={(from, to) => set({ createdFrom: from, createdTo: to })}
          />
          <DateRange
            label="Updated"
            from={filters.updatedFrom}
            to={filters.updatedTo}
            onChange={(from, to) => set({ updatedFrom: from, updatedTo: to })}
          />
          <TextField
            select
            size="small"
            label="Age"
            value={filters.olderThanHours ?? ''}
            onChange={(e) => set({ olderThanHours: e.target.value ? Number(e.target.value) : undefined })}
            sx={{ width: 190 }}
          >
            <MenuItem value="">Any age</MenuItem>
            {AGE_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      </Collapse>
    </Box>
  );
};

const DateRange = ({
  label,
  from,
  to,
  onChange,
}: {
  label: string;
  from?: string;
  to?: string;
  onChange: (from?: string, to?: string) => void;
}) => (
  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
    <TextField
      size="small"
      type="date"
      label={`${label} from`}
      value={from || ''}
      InputLabelProps={{ shrink: true }}
      inputProps={{ max: to || undefined }}
      onChange={(e) => onChange(e.target.value || undefined, to)}
      sx={{ width: 160 }}
    />
    <TextField
      size="small"
      type="date"
      label={`${label} to`}
      value={to || ''}
      InputLabelProps={{ shrink: true }}
      inputProps={{ min: from || undefined }}
      onChange={(e) => onChange(from, e.target.value || undefined)}
      sx={{ width: 160 }}
    />
  </Box>
);

export default SrFiltersBar;
