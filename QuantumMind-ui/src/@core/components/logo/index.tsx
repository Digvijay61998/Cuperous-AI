import React from 'react'
type Props = {
  width: number,
  height: number
}
export default function index({ width = 40,
  height = 40 }: Props) {

  return (
    <img src={"/logo.png"} width={width} height={height} style={{ borderRadius: "50%", boxShadow: "0 0 10px #0e00cf29" }} />
  )
}