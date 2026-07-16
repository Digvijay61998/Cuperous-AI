import React from 'react'

type Props = {}

export default function TypingIndecator({}: Props) {
  return (
    <div className="ticontainer">
    <div className="tiblock">
      <div className="tidot"></div>
      <div className="tidot"></div>
      <div className="tidot"></div>

    </div>
  </div>
  )
}