import * as React from 'react';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
type Props = {}
export default function ColorChips(props: Props) {
  const data = [
    {
      "title": "Transfer money",
      "type": "goto",
      "value": "865623bf-cfbc-4abf-a5b4-e012421405f1",
      "id": "e9f26984-2550-422c-887b-66207da30d95-50f0a481"
    },
    {
      "title": "Create account",
      "type": "goto",
      "value": "865623bf-cfbc-4abf-a5b4-e012421405f1",
      "id": "e9f26984-2550-422c-887b-66207da30d95-50f0a481"
    },
  ]
  return (
    <Stack direction="row" justifyContent="flex-start" flex={1} gap={1} marginTop={2} flexWrap="wrap" spacing={1} width="100%" >

      {
        data.map((item: any) =>
          <Button sx={{ m: 0, p: 0, borderRadius: "50%", textTransform:"capitalize" }}>

            <Chip
              label={item.title}
              color="primary"
              variant="outlined"

              sx={{ fontSize: '0.7rem', cursor: "pointer" }}
            />
          </Button>
        )
      }
    </Stack>
  );
}
