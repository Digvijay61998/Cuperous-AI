import { Slide } from "react-slideshow-image";

import { Icon } from "@iconify/react";
import { IconButton } from "@mui/material";
import axios from "axios";
type Props = {
  galleryArray: any;
  handleButtonFunction: any;
  widgetToken: string;
  socket: any;
  updatemyMessages: any;
};

const Gallery = ({
  galleryArray,
  handleButtonFunction,
  socket,
  updatemyMessages,
}: Props) => {
  const properties = {
    prevArrow: (
      <IconButton
        size="small"
        color="primary"
        sx={{ ml: 0, bgcolor: "#dcdcdca8" }}
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
        sx={{ mr: 1.5, bgcolor: "#dcdcdca8" }}
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

  const buttonStyle: any = {
    width: "100%",
    backgroundColor: "#fff",
    border: "0",
    color: "#00a7ff",
    borderRadius: "0",
    borderTop: "1px solid #00a7ff",
    textTransform: "capitalize",
    fontFamily: "Inter, sans-serif",
    fontSize: "1rem",
    fontWeight: 500,
    padding: "0.5rem 0",

  };

  const handleButton = async (e: any, value: string) => {
    e.preventDefault();
    const message = {
      value: value,
      type: "text",
      senderId: "visitor_id_1010",
      time: new Date().toISOString(),
      id: new Date().getTime(),
    };
    await socket.emit("events", {
      event: "chat-message-bot",
      data: { message: value },
    });
    updatemyMessages(message);
  };
  return (
    <>
      {galleryArray && galleryArray?.length > 0 && (
        <div style={{ maxWidth: "100%", marginTop: "0.5rem" }}>
          <Slide
            slidesToScroll={1.5}
            slidesToShow={1.5}
            autoplay={true}
            {...properties}
          >
            {galleryArray.map((item: any, index: number) => (
              <div key={index} className="each-slide-effect">
                <div
                  style={{
                    width: "90%",
                    height: "auto",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    margin: "0.4rem",
                    boxShadow: "0 0 5px grey",
                    borderRadius: "0.5rem",
                  }}
                >
                  <img
                    src={item?.image}
                    style={{
                      objectFit: "cover",
                      width: "100%",
                      height: 200,
                      borderTopLeftRadius: "0.5rem",
                      borderTopRightRadius: "0.5rem",
                    }}
                  />
                  <h4
                    style={{
                      margin: "0.2rem 0.2rem",
                      padding: "0",
                      fontFamily: "Inter, sans-serif",
                      textAlign: "center",
                    }}
                  >
                    {item?.title}
                  </h4>
                  <p
                    style={{
                      fontSize: "0.8rem",
                      textAlign: "justify",
                      margin: "0 1rem",
                      marginBottom: "1rem",
                      lineHeight: "18px",
                      fontFamily: "Inter, sans-serif",
                      overflow: "hidden",
                    }}
                  >
                    {item?.description}
                  </p>
                  {item?.buttons && item.buttons.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        width: "100%",
                      }}
                    >
                      {item?.buttons.map((item: any, index: number) => {
                        if (item?.type === "phone") {
                          return (
                            <button key={index} style={buttonStyle}>
                              <a href={`tel:${item.value}`}>{item.title}</a>
                            </button>
                          );
                        } else if (item?.type === "goto") {
                          return (
                            <button
                            key={index}
                              style={buttonStyle}
                              onClick={() =>
                                handleButtonFunction("goto", item.value)
                              }
                            >
                              {item.title}
                            </button>
                          );
                        } else if (item?.type === "url") {
                          return (
                            <button key={index} style={buttonStyle}>
                              <a
                                href={item.value}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {item.title}
                              </a>
                            </button>
                          );
                        } else if (item?.type === "text") {
                          return (
                            <button
                            key={index}
                              style={buttonStyle}
                              onClick={(e: any) => handleButton(e, item.value)}
                            >
                              {item?.title}
                            </button>
                          );
                        }
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </Slide>
        </div>
      )}
    </>
  );
};

export default Gallery;
