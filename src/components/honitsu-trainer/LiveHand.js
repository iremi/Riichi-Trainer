import React from 'react';
import Meld from '../Meld';
import { getTileImage, getTileAsText } from '../../scripts/TileConversions';
import { tileSortKey } from '../../scripts/HonitsuValue';
import { convertHandToTileIndexArray } from '../../scripts/HandConversions';
import { useTranslation } from 'react-i18next';

/**
 * The playable hand in the live trainer: clickable closed tiles, the tile just
 * drawn held apart the way it sits on a real rack, and any called sets.
 */
function LiveHand(props) {
    let { t } = useTranslation();
    let { hand, melds, lastDraw, onTileClick } = props;

    if (!hand) return null;

    let tiles = convertHandToTileIndexArray(hand);

    // The drawn tile is shown separately, so take one copy out of the sorted run.
    if (lastDraw >= 0) {
        let index = tiles.indexOf(lastDraw);
        if (index >= 0) tiles.splice(index, 1);
    }

    tiles.sort((a, b) => tileSortKey(a) - tileSortKey(b));

    let renderTile = (tile, key, extraClass) => (
        <div className={`honitsuTile liveTile ${extraClass || ""}`} key={key}>
            <img
                src={getTileImage(tile)}
                title={getTileAsText(t, tile)}
                alt={getTileAsText(t, tile)}
                onClick={onTileClick ? () => onTileClick(tile) : undefined}
            />
        </div>
    );

    return (
        <div className="honitsuHand liveHand">
            <div className="honitsuHand-closed">
                {tiles.map((tile, index) => renderTile(tile, index))}
            </div>
            {lastDraw >= 0 && renderTile(lastDraw, "draw", "liveTile--drawn")}
            {(melds || []).map((meld, index) => <Meld key={`meld${index}`} meld={meld} />)}
        </div>
    );
}

export default LiveHand;
