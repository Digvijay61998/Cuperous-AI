import React from 'react'
import ChatLog from 'src/views/service-request/list/view/ChatLogs';

type Props = {
    id: any
}

export default function OpenChatLogDrawer({id}: Props) {

  return (
    <div><ChatLog showIconOnly={true} id={id} /></div>
  )
}