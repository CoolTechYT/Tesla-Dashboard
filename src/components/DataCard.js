import React from 'react'
import {
    Card,
    StyledBody
} from "baseui/card";

const DataCard = (props) => {
    const renderMetric = (metric) => {
        if (typeof (metric) === "number" || typeof metric == "string") {
            return <span>{metric}</span>;
        } else if (typeof metric === "boolean") {
            return metric ? <span>Yes</span> : <span>No</span>;
        }
    };
    return (
        <Card style={{ textAlign: 'center' }}>
            <StyledBody>
                {props.label}
            </StyledBody>
            <StyledBody>
                {renderMetric(props.metric)}
            </StyledBody>
        </Card>
    )
}

export default DataCard;