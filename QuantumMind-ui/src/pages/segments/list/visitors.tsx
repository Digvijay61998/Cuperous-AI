import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'src/store';
import { useCallback, useEffect, useState } from 'react'
import { fetchVisitorDetail } from 'src/store/apps/segments';
import { AppDispatch } from 'src/store';

import VisitorList from 'src/views/visitors/list/VisitorsDataGrid';
import TableHeader from 'src/views/visitors/list/TableHeader';

const VisitorListSegment = ({ segmentId }: { segmentId: string }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [value, setValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);

  const { visitorDataList } = useSelector((state: RootState) => state.segments);
  const [visitorListDataFiltered, setVisitorListDataFiltered] = useState<any>(
    [],
  );

  const handleFilter = useCallback((val: string) => {
    setValue(val);
  }, []);

  useEffect(() => {
    if (segmentId) {
      setIsLoading(true);
      dispatch(fetchVisitorDetail({
        id : segmentId,
        search : value,
        skip: page*pageSize,
        limit : pageSize
      }));
      setIsLoading(false);
    }
  }, [segmentId]);

  useEffect(() => {
    if (value && value.trim() !== '') {
      let queryLowered = value?.toLowerCase();
      const filteredData = visitorDataList?.list?.filter(
        (item: any) =>
          item?.name?.toLowerCase().includes(queryLowered) ||
          item?.email?.toLowerCase().includes(queryLowered) ||
          item?.phone?.toLowerCase().includes(queryLowered),
      );
      setVisitorListDataFiltered(filteredData);
    } else {
      setVisitorListDataFiltered(visitorDataList?.list);
    }
  }, [value, visitorDataList?.list]);

  return (
    <>
      <TableHeader
        segmentId={segmentId}
        value={value}
        handleFilter={handleFilter}
      />
      <VisitorList 
        visitorListDataFiltered={visitorListDataFiltered} 
        isLoading={isLoading} 
        rowCountState={visitorListDataFiltered?.length || 0} 
        page={page}
        setPage={setPage} 
        pageSize={pageSize}
        setPageSize={setPageSize}
        rowsPerPageOptions={[10, 20, 30]}
        segmentId={segmentId}
      />
    </>
  );
};

export default VisitorListSegment;
