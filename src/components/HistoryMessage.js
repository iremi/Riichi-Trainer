import React from 'react';
import { ListGroupItem, Collapse, Row } from 'reactstrap';
import { withTranslation } from 'react-i18next';
import { getTileImage } from '../scripts/TileConversions';

/**
 * Renders a row of message text, turning <b>...</b> markers into bold elements and [[img:N]] markers
 * into inline tile images. Handles nesting (e.g. a tile image inside a bold span).
 */
function renderRow(text) {
    return text.split(/(<b>[\s\S]*?<\/b>|\[\[img:\d+\]\])/g).filter(part => part !== "").map((part, index) => {
        let bold = part.match(/^<b>([\s\S]*)<\/b>$/);
        if (bold) return <b key={index}>{renderRow(bold[1])}</b>;

        let image = part.match(/^\[\[img:(\d+)\]\]$/);
        if (image) return <img key={index} src={getTileImage(Number(image[1]))} alt="" style={{ height: "2em", verticalAlign: "text-bottom", margin: "0 0.1em" }} />;

        return part;
    });
}

class HistoryMessage extends React.Component {
    /* PROPS
        data (HistoryData),
        verbose,
        concise,
        spoilers
    */
    constructor(props) {
        super(props);
        this.state = { collapsed: true };
    }

    componentDidMount() {
        this.setState({
            collapsed: false
        });
    }

    render() {
        let { t } = this.props;
        if (!this.props.data) return <ListGroupItem></ListGroupItem>;

        let message = this.props.data.getMessage(t, this.props.concise, this.props.verbose, this.props.spoilers, this.props.tileImages);
        let messageRows = message.split("<br/>").map((row, index) => <Row key={index} style={index > 0 ? { marginTop: "0.35rem" } : undefined}><span>{renderRow(row)}</span></Row>)

        return (
            <Collapse isOpen={!this.state.collapsed}>
                <ListGroupItem className={this.props.data.getClassName()}>
                    {messageRows}
                    {this.props.data.hand ? <a className="tenhouLink" href={"http://tenhou.net/2/?q=" + this.props.data.hand} target="_blank" rel="noopener noreferrer">
                        {t("history.tenhouLinkText")}
                    </a> : ""}
                </ListGroupItem>
            </Collapse>
        );
    }
}

export default withTranslation()(HistoryMessage);