import React from 'react';
import Meld from '../Meld';
import { getTileImage, getTileAsText } from '../../scripts/TileConversions';
import { tileSortKey } from '../../scripts/HonitsuValue';
import { useTranslation } from 'react-i18next';

/**
 * Renders a honitsu drill hand: the closed tiles followed by any called sets.
 *
 * Tiles are a fixed size rather than sharing the row the way the efficiency
 * trainer's hand does, because several items show only the four-tile block the
 * question is about and those would otherwise render enormous.
 */
function HonitsuHand(props) {
    let { t } = useTranslation();
    let hand = props.hand;

    if (!hand) return null;

    let closed = hand.closed.slice().sort((a, b) => tileSortKey(a) - tileSortKey(b));

    return (
        <div className="honitsuHand">
            <div className="honitsuHand-closed">
                {closed.map((tile, index) => (
                    <div className="honitsuTile" key={index}>
                        <img
                            src={getTileImage(tile)}
                            title={getTileAsText(t, tile)}
                            alt={getTileAsText(t, tile)}
                        />
                    </div>
                ))}
            </div>
            {hand.melds.map((meld, index) => <Meld key={index} meld={meld} />)}
        </div>
    );
}

export default HonitsuHand;
