import { getTileAsText } from "../../scripts/TileConversions";
import HistoryData from "../../models/HistoryData";
import { CSS_CLASSES } from "../../Constants";

export default class UkeireHistoryData extends HistoryData {
    /** A history object for the ukeire trainer, which tells the efficiency of a given discard. */
    constructor(chosenTile = -1, chosenUkeire = -1, bestTile = -1, bestUkeire = undefined, shanten = -1, hand = "", handUkeire = -1, discards = [], drawnTile = -1, message = undefined) {
        super(message);
        this.chosenTile = chosenTile;
        this.chosenUkeire = chosenUkeire;
        this.bestTile = bestTile;
        this.bestUkeire = bestUkeire;
        this.shanten = shanten;
        this.hand = hand;
        this.handUkeire = handUkeire;
        this.discards = discards;
        this.drawnTile = drawnTile;
    }

    getMessage(t, concise, verbose, spoilers, tileImages) {
        let mode = "verbose";
        if (concise) mode = "concise";

        // The single highlighted tiles (discarded, suggested, drawn) become images when enabled; the
        // acceptance lists always stay as text names.
        let tileLabel = (tile) => tileImages ? `[[img:${tile}]]` : getTileAsText(t, tile, verbose);
        let tileList = (tiles) => tiles.map((tile) => getTileAsText(t, tile, verbose)).join(", ");

        // Row 1: the player's own discard and its result. The explanatory lead-in (including the
        // discarded tile) is bolded; the tile list that follows is not.
        let discard = t(`history.${mode}.discard`, { tile: tileLabel(this.chosenTile) });
        let result;

        if (this.chosenUkeire.value > 0 || this.shanten === 0) {
            result = "<b>" + discard + t(`history.${mode}.acceptance`, { count: this.chosenUkeire.value }) + "</b>";
            result += t(`history.${mode}.tilesExpanded`, { tiles: tileList(this.chosenUkeire.tiles) });
        }
        else {
            // Bold the discard clause here; the loweredShanten string carries its own <b> markers for
            // the clause that should stay bold, since that boundary differs per language.
            result = "<b>" + discard + "</b>" + t(`history.${mode}.loweredShanten`);
        }

        // Row 2: the most efficient discard. The lead-in (down to the tile count) is bolded; the tile list is not.
        if (this.chosenUkeire.value < this.bestUkeire.value) {
            result += "<br/><b>" + t(`history.${mode}.optimal`);

            if (spoilers) {
                result += t(`history.${mode}.optimalSpoiler`, { tile: tileLabel(this.bestTile), tiles: tileList(this.bestUkeire.tiles) });
            }

            result += t(`history.${mode}.acceptance`, { count: this.bestUkeire.value }) + "</b>";

            if (spoilers) {
                result += t(`history.${mode}.tilesExpanded`, { tiles: tileList(this.bestUkeire.tiles) });
            }
        }
        else {
            result += t(`history.${mode}.best`);
        }

        if (this.shanten <= 0 && this.handUkeire.value === 0) {
            result += t(`history.${mode}.exceptionalNoten`);
        }

        if (this.isFuriten()) {
            if (this.shanten <= 0) {
                result += t(`history.${mode}.furiten`);
            } else {
                result += t(`history.${mode}.furitenWarning`);
            }
        }

        // Row 3: what was drawn for the next turn, on its own line.
        if (this.shanten > 0) {
            if (this.drawnTile === -1) {
                result += "<br/><b>" + t(`history.${mode}.exhausted`) + "</b>";
            } else {
                result += "<br/><b>" + t(`history.${mode}.draw`, { tile: tileLabel(this.drawnTile) }) + "</b>";
            }
        }

        result += super.getMessage(t);

        return result;
    }

    getClassName() {
        let className = "";

        if (this.chosenUkeire.value <= 0 && this.shanten > 0) {
            className = CSS_CLASSES.INCORRECT;
        }
        else if (this.bestUkeire.value === this.chosenUkeire.value) {
            className = CSS_CLASSES.CORRECT;
        }
        else {
            className = CSS_CLASSES.WARNING;
        }

        return className;
    }

    /** Returns whether the hand is in furiten, or might be later. */
    isFuriten() {
        return this.chosenUkeire.tiles.some(tile => this.discards.includes(tile));
    }
}
