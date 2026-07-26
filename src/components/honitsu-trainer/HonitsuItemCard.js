import React from 'react';
import { Button, Row, Col } from 'reactstrap';
import HonitsuHand from './HonitsuHand';
import { getTileImage, getTileAsText } from '../../scripts/TileConversions';
import { withTranslation } from 'react-i18next';
import { SEAT_NAMES, CSS_CLASSES } from '../../Constants';

/**
 * Renders a single drill item: the situation, the answer options, and once an
 * answer is given, the feedback that explains it.
 *
 * All three drill types score identically, so the type only decides which
 * context the situation needs. The presence of a field decides whether it is
 * shown, rather than the item's type, because the bank contains items whose
 * type and shape disagree (r-08 is typed as calling but asks for a discard).
 */
class HonitsuItemCard extends React.Component {
    /**
     * Renders a small labelled tile, used for the offered, drawn and dora tiles.
     * @param {string} label The label to show beside the tile.
     * @param {TileIndex} tile The tile to show.
     * @returns {JSX.Element} The chip.
     */
    renderTileChip(label, tile) {
        let { t } = this.props;

        return (
            <div className="honitsuChip">
                <span className="honitsuChip-label">{label}</span>
                <img
                    className="honitsuChip-tile"
                    src={getTileImage(tile)}
                    title={getTileAsText(t, tile)}
                    alt={getTileAsText(t, tile)}
                />
            </div>
        );
    }

    /**
     * Renders the seat and round wind, which change the answer whenever a wind
     * is involved, so they are always shown when the item provides them.
     * @returns {JSX.Element[]} The wind chips.
     */
    renderWinds() {
        let { t, item } = this.props;
        let chips = [];

        if (item.roundWind !== undefined) {
            chips.push(
                <div className="honitsuChip" key="round">
                    <span className="honitsuChip-label">{t("honitsu.roundWind")}</span>
                    <span className="honitsuChip-value">{t(SEAT_NAMES[item.roundWind - 31])}</span>
                </div>
            );
        }

        if (item.seatWind !== undefined) {
            chips.push(
                <div className="honitsuChip" key="seat">
                    <span className="honitsuChip-label">{t("honitsu.seatWind")}</span>
                    <span className="honitsuChip-value">{t(SEAT_NAMES[item.seatWind - 31])}</span>
                </div>
            );
        }

        return chips;
    }

    /**
     * Works out how an option should be highlighted once an answer is given.
     * The correct option is always marked, so a wrong answer still shows what
     * the right one was.
     * @param {Object} option The option being rendered.
     * @returns {string} The class name for the option.
     */
    getOptionClass(option) {
        let { answered, chosen } = this.props;

        if (!answered) return "honitsuOption";
        if (option.correct) return `honitsuOption ${CSS_CLASSES.CORRECT}`;
        if (option === chosen) return `honitsuOption ${CSS_CLASSES.INCORRECT}`;

        return "honitsuOption honitsuOption--muted";
    }

    /**
     * Renders the han breakdown attached to an item, either the value gate's
     * answer or the "if you complete this" note on a routing or calling item.
     * @returns {JSX.Element} The breakdown, or nothing if the item has none.
     */
    renderHanBreakdown() {
        let { t, item } = this.props;
        let breakdown = item.answer || item.hanIfCompleted;

        if (!breakdown || !breakdown.sources) return null;

        return (
            <div className="honitsuBreakdown">
                <span className="honitsuBreakdown-label">
                    {item.answer ? t("honitsu.hanBreakdown") : t("honitsu.ifCompleted")}
                </span>
                <span>{breakdown.sources.join(" + ")} = {breakdown.han} han</span>
                {breakdown.value && <span className="honitsuBreakdown-verdict">{breakdown.value}</span>}
                {breakdown.verdict && <span className="honitsuBreakdown-verdict">{breakdown.verdict}</span>}
            </div>
        );
    }

    render() {
        let { t, item, answered, chosen, onAnswer, onNext } = this.props;

        if (!item) return null;

        // Only one of these ever applies: a call shows the tile on offer, a
        // discard question shows what you just drew.
        let resultHand = answered && chosen && !chosen.correct && item.resultIfWrong
            ? item.resultIfWrong
            : item.result;
        let resultLabel = answered && chosen && !chosen.correct && item.resultIfWrong
            ? t("honitsu.resultIfWrong")
            : t("honitsu.result");

        return (
            <div className="honitsuCard">
                <div className="honitsuChips">
                    {this.renderWinds()}
                    {item.dora !== undefined && this.renderTileChip(t("honitsu.dora"), item.dora)}
                    {item.generated && <div className="honitsuChip">{t("honitsu.generated")}</div>}
                </div>

                <Row className="mt-2">
                    <Col xs="12"><span className="honitsuPrompt">{item.prompt}</span></Col>
                </Row>

                {item.note &&
                    <Row><Col xs="12"><span className="honitsuNote">{item.note}</span></Col></Row>}

                <HonitsuHand hand={item.hand} />

                {(item.offered !== undefined || item.drawn !== undefined) &&
                    <div className="honitsuChips mt-2">
                        {item.offered !== undefined && this.renderTileChip(t("honitsu.offered"), item.offered)}
                        {item.drawn !== undefined && this.renderTileChip(t("honitsu.drawn"), item.drawn)}
                    </div>}

                <div className="honitsuOptions mt-3">
                    {item.options.map((option) => (
                        <Button
                            key={option.id}
                            className={this.getOptionClass(option)}
                            disabled={answered}
                            onClick={() => onAnswer(option)}
                        >
                            {option.label}
                        </Button>
                    ))}
                </div>

                {answered &&
                    <div className="honitsuFeedback mt-3">
                        <div className={chosen.correct ? "honitsuVerdict text-success" : "honitsuVerdict text-danger"}>
                            {chosen.correct ? t("honitsu.correct") : t("honitsu.incorrect")}
                        </div>

                        {resultHand &&
                            <div className="mt-2">
                                <span className="honitsuNote">{resultLabel}</span>
                                <HonitsuHand hand={resultHand} />
                            </div>}

                        {this.renderHanBreakdown()}

                        <p className="honitsuRationale mt-2">{item.rationale}</p>

                        <Button color="warning" onClick={onNext}>{t("honitsu.next")}</Button>
                    </div>}
            </div>
        );
    }
}

export default withTranslation()(HonitsuItemCard);
