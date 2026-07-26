import React from 'react';
import LiveHand from './LiveHand';
import { getTileImage, getTileAsText } from '../../scripts/TileConversions';
import { withTranslation } from 'react-i18next';
import { SEAT_NAMES, PLAYER_NAMES } from '../../Constants';

/**
 * The four seats laid out around a table, the way the hand actually looks.
 *
 * Only what the trainer really models is shown. There are no names, scores or
 * riichi sticks here because opponents are not simulated hands — their discards
 * come straight off the wall — and a badge claiming otherwise would imply
 * defensive decisions this trainer cannot score.
 */
class LiveTable extends React.Component {
    /**
     * Works out an opponent's seat wind. Play passes East, South, West, North,
     * so each seat to your right is one wind further along.
     * @param {number} player The player index, where 0 is you.
     * @returns {TileIndex} That player's seat wind.
     */
    getSeatWind(player) {
        return 31 + ((this.props.seatWind - 31 + player) % 4);
    }

    /**
     * Renders a discard pond as a grid, the way tiles are actually laid down.
     * @param {TileIndex[]} pile The discards.
     * @returns {JSX.Element} The pond.
     */
    renderPond(pile) {
        let { t } = this.props;

        return (
            <div className="pond">
                {pile.map((tile, index) => (
                    <img
                        key={index}
                        className="pondTile"
                        src={getTileImage(tile)}
                        alt={getTileAsText(t, tile)}
                        title={getTileAsText(t, tile)}
                    />
                ))}
            </div>
        );
    }

    /**
     * Renders one opponent's seat.
     * @param {number} player The player index.
     * @returns {JSX.Element} The seat.
     */
    renderSeat(player) {
        let { t, discards } = this.props;
        let seatClass = ["you", "shimocha", "toimen", "kamicha"][player];

        return (
            <div className={`tableSeat tableSeat--${seatClass}`}>
                <div className="tableSeat-header">
                    <span className="tableSeat-wind">{t(SEAT_NAMES[this.getSeatWind(player) - 31])}</span>
                    <span className="tableSeat-name">{t(PLAYER_NAMES[player])}</span>
                    {/* Only the left player can be chi'd from, which is worth
                        having on screen while deciding whether to pass. */}
                    {player === 3 && <span className="tableSeat-tag">{t("honitsu.live.chiSource")}</span>}
                </div>
                {this.renderPond(discards[player])}
            </div>
        );
    }

    render() {
        let { t, hand, melds, lastDraw, onTileClick, discards,
            roundWind, doraIndicator, turn, wallCount } = this.props;

        return (
            <div className="mahjongTable">
                {this.renderSeat(2)}
                {this.renderSeat(3)}

                <div className="tableCenter">
                    <div className="tableCenter-round">
                        {t("honitsu.live.round", { wind: t(SEAT_NAMES[roundWind - 31]) })}
                    </div>
                    <div className="tableCenter-doraLabel">{t("honitsu.live.doraIndicator")}</div>
                    <img
                        className="tableCenter-dora"
                        src={getTileImage(doraIndicator)}
                        alt={getTileAsText(t, doraIndicator)}
                        title={getTileAsText(t, doraIndicator)}
                    />
                    <div className="tableCenter-counts">
                        <span>{t("honitsu.live.turnCount", { turn })}</span>
                        <span>{t("honitsu.live.wallCount", { wall: wallCount })}</span>
                    </div>
                </div>

                {this.renderSeat(1)}

                <div className="tableSeat tableSeat--you">
                    <div className="tableSeat-header">
                        <span className="tableSeat-wind">{t(SEAT_NAMES[this.getSeatWind(0) - 31])}</span>
                        <span className="tableSeat-name">{t(PLAYER_NAMES[0])}</span>
                    </div>
                    <LiveHand
                        hand={hand}
                        melds={melds}
                        lastDraw={lastDraw}
                        onTileClick={onTileClick}
                    />
                    {this.renderPond(discards[0])}
                </div>
            </div>
        );
    }
}

export default withTranslation()(LiveTable);
