import React from 'react'
import { useStyletron } from 'baseui';

const Outer = ({ children }) => {
    const [css, theme] = useStyletron();
    return (
        <div className={css({
            marginTop: '40px !important;'
        })}>
            {children}
        </div>
    );
}

export default Outer
