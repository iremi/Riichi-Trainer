import React from 'react';
import { withTranslation } from 'react-i18next';
import { SUIT_NAMES } from '../../scripts/HonitsuAnalysis';

/**
 * The on-demand coach.
 *
 * Hidden until asked for, so the hand is a real test by default. When opened it
 * shows both lines with their actual numbers rather than a single verdict,
 * because the routing decision is precisely the trade between speed and value.
 */
class RoadHint extends React.Component {
    /**
     * Renders one line's numbers.
     * @param {string} label The line's name.
     * @param {number} shanten The line's shanten.
     * @param {number} ukeire The acceptance of the line's preferred discard.
     * @param {Object} value The line's value estimate.
     * @returns {JSX.Element} The row.
     */
    renderLine(label, shanten, ukeire, value) {
        let { t } = this.props;

        return (
            <div className="roadHint-line">
                <span className="roadHint-lineLabel">{label}</span>
                <span>{t("honitsu.live.shantenValue", { shanten })}</span>
                <span>{t("honitsu.live.ukeireValue", { ukeire })}</span>
                <span className="roadHint-value">{value}</span>
            </div>
        );
    }

    render() {
        let { t, analysis } = this.props;

        if (!analysis) return null;

        let { speed, honitsu, road } = analysis;

        // A pair is a ceiling, not a han, so both numbers are shown whenever
        // they disagree.
        let honitsuValue = honitsu
            ? (honitsu.value.han === honitsu.value.ceiling
                ? t("honitsu.live.hanValue", { han: honitsu.value.han })
                : t("honitsu.live.hanCeiling", { han: honitsu.value.han, ceiling: honitsu.value.ceiling }))
            : "";

        let speedValue = speed.value.yakuless
            ? t("honitsu.live.noYaku")
            : t("honitsu.live.hanValue", { han: speed.value.han });

        return (
            <div className={`roadHint roadHint--${road.road}`}>
                <div className="roadHint-verdict">
                    {t(`honitsu.live.roads.${road.road}`)}
                    {road.suit !== undefined && road.suit !== null && honitsu &&
                        ` — ${t(`honitsu.live.suits.${SUIT_NAMES[road.suit]}`)}`}
                </div>
                <div className="roadHint-reason">{t(`honitsu.live.reasons.${road.reason}`)}</div>

                {this.renderLine(t("honitsu.live.speedLine"), speed.shanten,
                    speed.best >= 0 ? speed.ukeire[speed.best].value : 0, speedValue)}

                {honitsu && this.renderLine(t("honitsu.live.honitsuLine"), honitsu.shanten,
                    honitsu.best >= 0 ? honitsu.ukeire[honitsu.best].value : 0, honitsuValue)}

                {honitsu && honitsu.value.pending.length > 0 &&
                    <div className="roadHint-pending">
                        {t("honitsu.live.pending", { sources: honitsu.value.pending.join(", ") })}
                    </div>}
            </div>
        );
    }
}

export default withTranslation()(RoadHint);
