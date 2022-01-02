import React from 'react'
import { useStyletron } from 'baseui';

const Inner = ({ children }) => {
    const [css, theme] = useStyletron();

    return (
        <div
            className={css({
                marginTop: 40,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                color: theme.colors.accent700,
                padding: '.25rem',
            })}
        >
            {children}
        </div>
    )
}

export default Inner