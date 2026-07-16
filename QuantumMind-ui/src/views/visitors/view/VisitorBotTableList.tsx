// ** React Imports

// ** MUI Imports
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import { styled } from '@mui/material/styles';

import Link from 'next/link';

import { Tooltip } from '@mui/material';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
// ** Third Party Imports
import CustomChip from 'src/@core/components/mui/chip';
// ** Type Imports
import { IconButton } from '@mui/material';
import { useSelector } from 'react-redux';
import { ThemeColor } from 'src/@core/layouts/types';
import returnPlatformIcon from 'src/components/PlatforomIcons';
import { RootState } from 'src/store';
import { ProjectListDataType } from 'src/types/apps/userTypes';
import ChatLog from 'src/views/service-request/list/view/ChatLogs';
interface Props {
  tab: string;
  //invoiceData: InvoiceType[];
  visitorId: any;
}

interface CellType {
  row: ProjectListDataType;
}

const StyledLink = styled('a')(({ theme }) => ({
  fontWeight: 600,
  fontSize: '1rem',
  cursor: 'pointer',
  textDecoration: 'none',
  color: theme.palette.text.secondary,
  '&:hover': {
    color: theme.palette.primary.main,
  },
}));

const Img = styled('img')(({ theme }) => ({
  width: 32,
  height: 32,
  borderRadius: '50%',
  marginRight: theme.spacing(3),
}));

interface UserStatusType {
  [key: string]: ThemeColor;
}

const userStatusObj: UserStatusType = {
  active: 'success',
  in_progress: 'warning',
  expired: 'secondary',
};
const InvoiceListTable = ({}: any) => {
  // ** State
  const { conversations } = useSelector((state: RootState) => state.visitors);
  return (
    <Card sx={{ padding: 4 }}>
      <CardHeader title="Conversation Details" />
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Bot Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Platform</TableCell>

              <TableCell>Handled By</TableCell>
              <TableCell>Created On</TableCell>

              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {conversations.map((row: any, index: number) => (
              <TableRow
                key={index}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell>
                  <Link
                    href={`/bots/settings/${row?.bot?._id || row?.bot?.id}`}
                  >
                    <StyledLink>{row?.bot?.name}</StyledLink>
                  </Link>
                </TableCell>

                <TableCell>
                  <CustomChip
                    rounded
                    skin="light"
                    size="small"
                    label={row?.status}
                    color={userStatusObj[row?.status]}
                  />
                </TableCell>
                <TableCell>
                  <Tooltip
                    title={
                      row?.platform.charAt(0).toUpperCase() +
                      row?.platform.slice(1)
                    }
                    placement="top"
                    arrow
                  >
                    <IconButton aria-label="Platform" size="small">
                      {returnPlatformIcon(row?.platform)}
                    </IconButton>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  {row?.transferredToAgent ? 'Agent' : 'Bot'}
                </TableCell>
                <TableCell>{
                  new Date(row?.createdAt).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric',
                  })
                  }</TableCell>
                <TableCell>
                  <ChatLog showIconOnly={true} id={row?.id || row?._id} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
};

export default InvoiceListTable;
