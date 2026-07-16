import { Icon } from '@iconify/react';
import { Stack } from '@mui/material';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import axios from 'axios';
type Props = {
  offersArray: any;
  widgetToken: any;
};
export default function MediaControlCard({ offersArray, widgetToken }: Props) {
  const handleClickEvent = async (data: any) => {
    try {
      const response = await axios.post(
        `${window.baseUrl}/api/widget/click`,
        {
          ...data.data,
        },
        {
          headers: {
            Authorization: `Bearer ${data.token}`,
          },
        },
      );
      return response.data;
    } catch (error: any) {
      console.log('error', error);
    }
  };
  return (
    <>
      {offersArray?.cards && offersArray.cards.length > 0 && (
        <div>
          <Typography
            variant="button"
            display="block"
            sx={{
              ml: 1,
              mt: 2,
              fontWeight: 'bold',
              textAlign: 'center',
              textTransform: 'uppercase',
            }}
            gutterBottom
          >
            {offersArray?.title}
          </Typography>
          {offersArray.cards &&
            offersArray.cards.map((item: any, index: number) => {
              return (
                <div
                  key={index}
                  style={{
                    maxHeight: 200,
                    margin: '0.4rem  auto',
                    maxWidth: '95%',
                    padding: '0.2rem',
                    boxShadow: '0 0 3px grey',
                    borderRadius: '0.2rem',
                    position: 'relative',
                  }}
                >
                  <Stack
                    width="100%"
                    direction="row"
                    justifyContent="flex-start"
                    alignItems="flex-start"
                  >
                    <CardMedia
                      component="img"
                      sx={{
                        width: '30%',
                        height: 120,

                        m: 1,
                        borderRadius: 1,
                        objectFit: 'cover',
                      }}
                      image={item.image}
                      alt="offer image"
                    />
                    {/* <img
            src="https://picsum.photos/800/300"
            width="30%"
            height="120"
            style={{ objectFit: "fill", margin:"0.4rem" }}
          /> */}
                    <Stack
                      direction="column"
                      justifyContent="flex-start"
                      alignItems="flex-start"
                      width="70%"
                      maxHeight={130}
                    >
                      <Typography sx={{ m: 0.5 }}>
                        {item.title}{' '}
                        <Icon icon="mdi:new-box" fontSize={21} color="red" />
                      </Typography>
                      <Typography
                        sx={{
                          height: 90,
                          width: '95%',
                          overflow: 'hidden',
                          lineHeight: '18px',
                          textAlign: 'justify',
                          ml: 1,
                          fontSize: 13,
                        }}
                      >
                        {item.description}
                      </Typography>
                      <a
                        onClick={(e: any) =>
                          handleClickEvent({
                            data: {
                              type: 'click-on-offer',
                              tag: item?.tag || 'Unknown',
                              id: offersArray?.id,
                            },
                            token: widgetToken,
                          })
                        }
                        style={{ marginLeft: '0.3rem' }}
                        href={item.link}
                        target="_blank"
                      >
                        click here to know more
                      </a>
                    </Stack>
                  </Stack>
                </div>
              );
            })}
        </div>
      )}
    </>
  );
}
