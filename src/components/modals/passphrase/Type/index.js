import React from 'react';
import Icon from 'components/Icon';
import colors from 'config/colors';
import icons from 'config/icons';
import styled from 'styled-components';
import { H3 } from 'components/Heading';

const Wrapper = styled.div`
    width: 360px;
    padding: 24px 48px;
`;

const Header = styled.div``;

const Confirmation = (props) => {
    if (!props.modal.opened) return null;
    const { device } = props.modal;

    return (
        <Wrapper>
            <Header>
                <Icon icon={icons.T1} size={60} color={colors.TEXT_SECONDARY} />
                <H3>Complete the action on { device.label } device</H3>
            </Header>
        </Wrapper>
    );
};

export default Confirmation;