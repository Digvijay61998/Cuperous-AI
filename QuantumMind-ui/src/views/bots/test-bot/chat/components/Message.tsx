import React from 'react'
import { Link, Typography } from '@mui/material'
type Props = {
    isSender: boolean,
    message: string
}

// Only http(s) links become anchors. Schemes like javascript: or data: are
// deliberately not matched, so a crafted message can't inject a script URL.
const URL_PATTERN = /(https?:\/\/[^\s<>"']+)/g

/**
 * Renders message text, turning bare URLs into real links. Bot nodes such as
 * OPEN_TEMPLATE deliver their call-to-action as plain text with the launch URL
 * appended, so without this the tester can see the link but not click it.
 */
const renderWithLinks = (text: string, isSender: boolean) => {
    const parts = text.split(URL_PATTERN)

    return parts.map((part, index) => {
        // split() with a capturing group puts the URLs at the odd indexes.
        const isUrl = index % 2 === 1
        if (!isUrl) return <React.Fragment key={index}>{part}</React.Fragment>

        return (
            <Link
                key={index}
                href={part}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                    wordBreak: 'break-all',
                    color: isSender ? 'common.white' : 'primary.main',
                    textDecoration: 'underline',
                }}
            >
                {part}
            </Link>
        )
    })
}

export default function Message({ isSender, message }: Props) {

    return (
        <Typography
            sx={{
                boxShadow: 1,
                borderRadius: 1,
                width: 'fit-content',
                fontSize: '0.875rem',
                whiteSpace: 'pre-wrap',
                p: (theme) => theme.spacing(3, 4),
                ml: isSender ? 'auto' : undefined,
                borderTopLeftRadius: !isSender ? 0 : undefined,
                borderTopRightRadius: isSender ? 0 : undefined,
                color: isSender ? 'common.white' : 'text.primary',
                backgroundColor: isSender
                    ? 'primary.main'
                    : 'background.paper',
            }}
        >
            {typeof message === 'string' ? renderWithLinks(message, isSender) : message}
        </Typography>
    )
}