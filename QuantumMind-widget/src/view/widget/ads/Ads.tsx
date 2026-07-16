import React from "react";
import { Zoom } from "react-slideshow-image";

import { Icon } from "@iconify/react";
import { IconButton } from "@mui/material";
import axios from "axios";
type Props = {
  adsSlideArray: any;
  widgetToken: string;
};
const AdsSlider = ({ adsSlideArray, widgetToken }: Props) => {
  const properties = {
    prevArrow: (
      <IconButton
        size="small"
        color="primary"
        sx={{ ml: 1, bgcolor: "#dcdcdca8" }}
      >
        <Icon
          icon="material-symbols:navigate-before"
          color="#000"
          fontSize={28}
          fontWeight="bold"
        />
      </IconButton>
    ),
    nextArrow: (
      <IconButton
        size="small"
        color="primary"
        sx={{ mr: 1, bgcolor: "#dcdcdca8" }}
      >
        <Icon
          icon="material-symbols:navigate-next"
          color="#000"
          fontSize={28}
          fontWeight="bold"
        />
      </IconButton>
    ),
  };
  const handleClickEvent = async (data: any) => {
    try {
      console.log({ data });
      const response = await axios.post(
        `${window.baseUrl}/api/widget/click`,
        {
          ...data.data,
        },
        {
          headers: {
            Authorization: `Bearer ${data.token}`,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      console.log("error", error);
    }
  };
  return (
    <>
      {adsSlideArray?.posters && adsSlideArray?.posters?.length > 0 && (
        <div style={{ maxWidth: "100%", marginTop: "0.5rem" }}>
          <Zoom scale={1.4} autoplay={true} {...properties}>
            {adsSlideArray?.posters.map((item: any, index: number) => (
              <div
                key={index}
                onClick={(e: any) => {
                  window.open(item.link, "_blank");
                  handleClickEvent({
                    data: { type: "click-on-ads", tag: item?.tag || "Unknown", id: adsSlideArray?.id },
                    token: widgetToken,
                  });
                }}
                className="each-slide-effect"
              >
                <div
                  style={{
                    backgroundImage: `url(${item.image})`,
                    position: "relative",
                    backgroundPosition: "center",
                  }}
                >
                  <a
                    href={item.link}
                    onClick={() =>
                      handleClickEvent({
                        data: {
                          type: "click-on-ads",
                          tag: item?.tag || 'Unknown',
                          id: adsSlideArray?.id,
                        },
                        token: widgetToken,
                      })
                    }
                    style={{
                      position: "absolute",
                      bottom: "0",
                      width: "100%",
                      backgroundColor: "#ffffff26",
                      textAlign: "center",
                    }}
                    target="_blank"
                  >
                    Visit Now
                  </a>
                </div>
              </div>
            ))}
          </Zoom>
        </div>
      )}
    </>
  );
};

export default AdsSlider;
