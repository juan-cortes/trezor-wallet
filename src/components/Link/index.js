import React from 'react';
import styled, { css } from 'styled-components';
import PropTypes from 'prop-types';
import { FONT_SIZE, TRANSITION } from 'config/variables';
import colors from 'config/colors';

const A = styled.a`
    text-decoration: none;
    cursor: pointer;
    transition: ${TRANSITION.HOVER};
    font-size: ${FONT_SIZE.SMALLER};

    ${props => props.isGreen && css`
        border-bottom: 1px solid ${colors.GREEN_PRIMARY};
    `}
    ${props => props.isGray && css`
        border-bottom: 1px solid ${colors.TEXT_SECONDARY};
    `}

    &,
    &:visited,
    &:active,
    &:hover {
        ${props => props.isGreen && css`
            color: ${colors.GREEN_PRIMARY};
        `}
        ${props => props.isGray && css`
            color: ${colors.TEXT_SECONDARY};
        `}
    }

    &:hover {
        border-color: transparent;
    }
`;

const Link = ({
    children, className, href, target, rel, onClick, isGreen = false, isGray = false,
}) => (
    <A
        className={className}
        href={href}
        target={target}
        rel={rel}
        onClick={onClick}
        isGreen={isGreen}
        isGray={isGray}
    >{children}
    </A>
);

Link.propTypes = {
    children: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.object,
        PropTypes.array,
    ]).isRequired,
    className: PropTypes.string,
    href: PropTypes.string,
    target: PropTypes.string,
    rel: PropTypes.string,
    onClick: PropTypes.func,
    isGreen: PropTypes.bool,
    isGray: PropTypes.bool,
};

export default Link;
