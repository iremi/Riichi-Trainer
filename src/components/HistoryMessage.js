import React from 'react';
import { ListGroupItem, Collapse, Row } from 'reactstrap';
import { withTranslation } from 'react-i18next';
import { getTileImage } from '../scripts/TileConversions';

/**
 * Renders a row of message text, turning <b>...</b> markers into bold elements and [[img:N]] markers
 * into inline tile images. Handles nesting (e.g. a tile image inside a bold span).
 */
function renderRow(text) {
    return text.split(/(<b>[\s\S]*?<\/b>|<c>[\s\S]*?<\/c>|\[\[img:\d+\]\]|\[\[bar:\d+\/\d+\]\])/g).filter(part => part !== "").map((part, index) => {
        let bold = part.match(/^<b>([\s\S]*)<\/b>$/);
        if (bold) return <b key={index}>{renderRow(bold[1])}</b>;

        let chip = part.match(/^<c>([\s\S]*)<\/c>$/);
        if (chip) return <span key={index} className="acceptanceCount">{renderRow(chip[1])}</span>;

        let bar = part.match(/^\[\[bar:(\d+)\/(\d+)\]\]$/);
        if (bar) {
            let chosen = Number(bar[1]);
            let best = Number(bar[2]);
            let percent = best > 0 ? Math.min(100, Math.round((chosen / best) * 100)) : 0;
            return (
                <span key={index} className="ukeireBar" role="img" aria-label={`${chosen} of ${best} tiles`}>
                    <span className="ukeireBar-track"><span className="ukeireBar-fill" style={{ width: percent + "%" }} /></span>
                    <span className="ukeireBar-label">{chosen} / {best}</span>
                </span>
            );
        }

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

        let message = this.props.data.getMessage(t, this.props.concise, this.props.verbose, this.props.spoilers, this.props.tileImages, this.props.progressBar);
        let messageRows = message.split("<br/>").map((row, index) => <Row key={index} style={index > 0 ? { marginTop: "0.35rem" } : undefined}><span style={{ display: "block", width: "100%" }}>{renderRow(row)}</span></Row>)

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