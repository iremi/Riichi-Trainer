import React from 'react';
import { getTileImage, getTileAsText } from '../scripts/TileConversions';
import { useTranslation } from 'react-i18next';

/**
 * Renders one called set. The tiles arrive in display order with the called
 * tile first, and that tile is drawn rotated the way it would sit on a real
 * table.
 */
function Meld(props) {
    let { t } = useTranslation();
    let meld = props.meld;

    if (!meld) return null;

    return (
        <div className="meld">
            {meld.tiles.map((tile, index) => (
                <div
                    key={index}
                    className={index === meld.called ? "meldTile meldTile--called" : "meldTile"}
                >
                    <img
                        src={getTileImage(tile)}
                        title={getTileAsText(t, tile)}
                        alt={getTileAsText(t, tile)}
                    />
                </div>
            ))}
        </div>
    );
}

export default Meld;
