import React from 'react'

import {
    HeaderNavigation,
    ALIGN,
    StyledNavigationList,
    StyledNavigationItem
} from "baseui/header-navigation";
import { StyledLink } from "baseui/link";
import { Button } from "baseui/button";

const Nav = () => {
    return (
        <HeaderNavigation>
            <StyledNavigationList $align={ALIGN.left}>
                <StyledNavigationItem>
                    TeslaDash
                </StyledNavigationItem>
            </StyledNavigationList>
            <StyledNavigationList $align={ALIGN.center} />
            <StyledNavigationList $align={ALIGN.right}>
            </StyledNavigationList>
        </HeaderNavigation>

    )
}

export default Nav
