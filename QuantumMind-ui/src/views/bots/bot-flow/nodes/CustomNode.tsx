import { memo, FC, CSSProperties } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import Chip from '@mui/material/Chip';
import Icon from 'src/@core/components/icon';
const sourceHandleStyleA: CSSProperties = { left: '50%', right: 'auto' };

const StartNode: FC<NodeProps> = ({ data }) => {
  return (
    <>
       {data?.title && <div style={{textAlign:"center", color:"#bdb8b8", fontSize:"0.75rem"}}>{data?.title }</div>}

      <div>
        <Chip
          sx={{
            // fontWeight: 'bold !important',
            background: "#000",
            color: "#fff",
            p: 4,
          }}
          icon={<Icon icon={data.icon} fontSize={20} color="#fff" />}
          label={data.label}

        />
      </div>
      <Handle
        type="source"
        position={Position.Right}
      // style={sourceHandleStyleA}
      style={{ bottom: 10, top: 'auto', background: '#555' }}
      />
    </>
  );
};
const CustomNode: FC<NodeProps> = ({ data, id }) => {
  return (
    <>
       {data?.title && <div style={{textAlign:"center", color:"#bdb8b8", fontSize:"0.75rem"}}>{data?.title }</div>}
      <Handle
        type="target"
        // id="a"
        position={Position.Left}
        style={{ bottom: 10, top: 'auto', background: '#555' }}
      />
      <div>
        <Chip
        
          variant="outlined"
          sx={{
            fontWeight: 'bold !important',
            border: "1px solid black !important",
            p: 4,
            backgroundColor: "#fff",
            textTransform: "lowercase"
          }}
          icon={<Icon icon={data.icon} fontSize={20} color={data.label === "Success" ? "green" : data.label === "Failure" ? "red" : "rgba(50, 71, 92, 0.87)"} />}
          label={data.label}
        />
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id="a"
      // style={sourceHandleStyleA}
      style={{ bottom: 10, top: 'auto', background: '#555' }}
      />
    </>
  );
};

const EndNode: FC<NodeProps> = ({ data, id }) => {
  return (
    <>
       {data?.title && <div style={{textAlign:"center", color:"#bdb8b8", fontSize:"0.75rem"}}>{data?.title }</div>}

      <Handle
        type="target"
        id={id}
        position={Position.Left}
      // style={sourceHandleStyleA}
      />
      <div>
        <Chip  
          sx={{
            fontWeight: 'bold !important',
            border: "1px solid black !important",
            p: 4,
            backgroundColor: "#cacaca",
            textTransform: "lowercase",
            background: "#000",
            color: "#fff",
          }}
          icon={<Icon icon={data.icon} fontSize={20} />}
          label={data.label}
        />
      </div>
    </>
  );
};

export { StartNode, CustomNode, EndNode };
