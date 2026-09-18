import { memo, FC, CSSProperties } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import Icon from 'src/@core/components/icon';
const sourceHandleStyleA: CSSProperties = { left: '50%', right: 'auto' };

/**
 * The small grey caption shown ABOVE a node (the node's `title`).
 *
 * WHY THIS EXISTS AS A COMPONENT
 * ------------------------------
 * All three node types render the same caption, and previously each did it with an
 * unconstrained `<div>`. A title is free text (it can hold a whole bot message like
 * the welcome copy), so a long one had nothing to wrap or clip against and stretched
 * into a single line spanning the entire canvas — dragging every node's layout with
 * it. Capping the width to the node and truncating to one ellipsised line keeps the
 * graph readable; the full text is still available on hover via the tooltip, so
 * nothing is lost.
 *
 * `maxWidth` is tied to the node chip's own footprint rather than a pixel value so
 * the caption never renders wider than the thing it labels.
 */
const NodeTitle: FC<{ title?: string }> = ({ title }) => {
  if (!title) return null;
  return (
    <Tooltip title={title} placement="top" arrow>
      <div
        style={{
          textAlign: 'center',
          color: '#bdb8b8',
          fontSize: '0.75rem',
          // Never wider than the node it captions; the caption is centered over
          // the chip below it.
          maxWidth: 220,
          margin: '0 auto',
          // One line, ellipsised. whiteSpace:nowrap + overflow:hidden +
          // textOverflow:ellipsis is the standard single-line truncation triad.
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          // A truncated caption is a hover affordance — the cursor signals "there
          // is more here".
          cursor: 'default',
        }}
      >
        {title}
      </div>
    </Tooltip>
  );
};

const StartNode: FC<NodeProps> = ({ data }) => {
  return (
    <>
      <NodeTitle title={data?.title} />

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
      <NodeTitle title={data?.title} />
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
      <NodeTitle title={data?.title} />

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
