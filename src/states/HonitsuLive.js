import React from 'react';
import { Row, Col, Button } from 'reactstrap';
import LiveHand from '../components/honitsu-trainer/LiveHand';
import RoadHint from '../components/honitsu-trainer/RoadHint';
import { analyzeHand, findCalls, takeTile, doraFromIndicator, estimateHonitsuValue, estimateSpeedValue, SUIT_NAMES } from '../scripts/HonitsuAnalysis';
import { calculateStandardShanten } from '../scripts/ShantenCalculator';
import { shuffleArray, randomInt } from '../scripts/Utils';
import { convertHandToTileIndexArray } from '../scripts/HandConversions';
import { getTileImage, getTileAsText } from '../scripts/TileConversions';
import { withTranslation } from 'react-i18next';
import { SEAT_NAMES, PLAYER_NAMES } from '../Constants';

/** @readonly How many tiles are dealt before the first discard. */
const STARTING_HAND_SIZE = 14;

/**
 * @readonly How many tiles stay live after the deal.
 *
 * A real hand has 70 draws shared between four players once the dead wall and
 * the other three starting hands are gone. Only this player holds real tiles
 * here, so the pool is simply capped to the same number: without it a hand runs
 * roughly twice as long as it should and the turn pressure disappears.
 */
const LIVE_WALL_SIZE = 70;

/**
 * The live honitsu trainer: play a hand out, choose your road as the tiles
 * arrive, and call or pass on what the table offers.
 *
 * The coach is silent unless asked. Every discard is analysed and recorded as
 * it happens, but the verdict is only shown through the Hint button during the
 * hand, and in the review once the hand ends.
 */
class HonitsuLive extends React.Component {
    constructor(props) {
        super(props);

        this.onTileClicked = this.onTileClicked.bind(this);
        this.onNewHand = this.onNewHand.bind(this);
        this.toggleHint = this.toggleHint.bind(this);
        this.onPassCall = this.onPassCall.bind(this);

        this.state = {
            hand: null,
            melds: [],
            tilePool: [],
            remainingTiles: null,
            discards: [[], [], [], []],
            lastDraw: -1,
            pendingCall: null,
            opponentIndex: 1,
            seatWind: 31,
            roundWind: 31,
            doraIndicator: 1,
            dora: 2,
            turn: 1,
            history: [],
            complete: false,
            result: null,
            showHint: false
        };
    }

    componentDidMount() {
        this.onNewHand();
    }

    /**
     * Builds a full wall, including one red five per suit. The red fives matter
     * here: a red five is the most reliable second source of han, and so the
     * cheapest way for a honitsu to reach mangan.
     * @returns {TileCounts} The tile counts of a full wall.
     */
    buildWall() {
        let counts = Array(38).fill(0);

        for (let i = 1; i < 30; i++) counts[i] = 4;
        for (let i = 31; i < 38; i++) counts[i] = 4;

        for (let base of [0, 10, 20]) {
            counts[base + 5]--;
            counts[base]++;
        }

        return counts;
    }

    onNewHand() {
        let wall = this.buildWall();
        let pool = shuffleArray(convertHandToTileIndexArray(wall));
        let hand = Array(38).fill(0);
        let remainingTiles = wall.slice();

        for (let i = 0; i < STARTING_HAND_SIZE; i++) {
            let tile = pool.pop();
            hand[tile]++;
            remainingTiles[tile]--;
        }

        let doraIndicator = pool.pop();
        remainingTiles[doraIndicator]--;

        // Everything past the live wall is the dead wall and the tiles the
        // other three players would be holding. They stay unseen, so they still
        // count towards remainingTiles.
        pool = pool.slice(0, LIVE_WALL_SIZE);

        this.setState({
            hand,
            melds: [],
            tilePool: pool,
            remainingTiles,
            discards: [[], [], [], []],
            lastDraw: -1,
            pendingCall: null,
            opponentIndex: 1,
            // A random seat makes guest winds a live question rather than a constant.
            seatWind: 31 + randomInt(4),
            roundWind: 31,
            doraIndicator,
            dora: doraFromIndicator(doraIndicator),
            turn: 1,
            history: [],
            complete: false,
            result: null,
            showHint: false
        });
    }

    getContext() {
        return {
            seatWind: this.state.seatWind,
            roundWind: this.state.roundWind,
            dora: this.state.dora
        };
    }

    /**
     * The shanten of the current hand, counting called sets.
     * @param {TileCounts} hand The closed hand.
     * @param {Object[]} melds The called sets.
     * @returns {number} The shanten.
     */
    getShanten(hand, melds) {
        return calculateStandardShanten(hand) - melds.length * 2;
    }

    toggleHint() {
        this.setState({ showHint: !this.state.showHint });
    }

    /**
     * Handles a discard, recording what the two lines wanted before the tile
     * leaves the hand.
     * @param {TileIndex} tile The tile to discard.
     */
    onTileClicked(tile) {
        if (this.state.complete || this.state.pendingCall) return;
        if (!this.state.hand || this.state.hand[tile] === 0) return;

        let hand = this.state.hand.slice();
        let melds = this.state.melds;
        let analysis = analyzeHand(hand, melds, this.state.remainingTiles, this.getContext());

        hand[tile]--;

        let discards = this.state.discards.map((pile) => pile.slice());
        discards[0].push(tile);

        let honitsu = analysis.honitsu;
        let road = analysis.road;
        let recommended = road.road === "honitsu" && honitsu ? honitsu.best : analysis.speed.best;

        let entry = {
            turn: this.state.turn,
            discarded: tile,
            road,
            recommended,
            // While hedging either line is a defensible discard, which is the
            // whole point of holding the option open.
            followed: road.road === "hedge"
                ? (tile === analysis.speed.best || (honitsu && tile === honitsu.best))
                : tile === recommended,
            speedShanten: analysis.speed.shanten,
            honitsuShanten: honitsu ? honitsu.shanten : null,
            honitsuSuit: honitsu ? honitsu.suit : null,
            honitsuHan: honitsu ? honitsu.value.han : null,
            honitsuCeiling: honitsu ? honitsu.value.ceiling : null
        };

        this.setState({
            hand,
            discards,
            lastDraw: -1,
            showHint: false,
            history: this.state.history.concat([entry])
        }, () => {
            if (this.getShanten(hand, melds) <= 0) {
                this.finishHand("tenpai");
            } else {
                this.runOpponents(1);
            }
        });
    }

    /**
     * Plays out the opponents' discards, stopping to ask whenever one of them
     * is callable.
     * @param {number} startIndex The player to resume from.
     */
    runOpponents(startIndex) {
        let pool = this.state.tilePool.slice();
        let remainingTiles = this.state.remainingTiles.slice();
        let discards = this.state.discards.map((pile) => pile.slice());

        for (let player = startIndex; player <= 3; player++) {
            if (pool.length === 0) {
                this.setState({ tilePool: pool, remainingTiles, discards },
                    () => this.finishHand("wall"));
                return;
            }

            let tile = pool.pop();
            discards[player].push(tile);
            remainingTiles[tile]--;

            // Only the player to your left can be chi'd from.
            let calls = findCalls(this.state.hand, tile, player === 3);

            if (calls.length > 0) {
                this.setState({
                    tilePool: pool,
                    remainingTiles,
                    discards,
                    pendingCall: { tile, from: player, calls },
                    opponentIndex: player + 1
                });
                return;
            }
        }

        this.setState({ tilePool: pool, remainingTiles, discards }, () => this.drawTile());
    }

    drawTile() {
        let pool = this.state.tilePool.slice();

        if (pool.length === 0) {
            this.finishHand("wall");
            return;
        }

        let tile = pool.pop();
        let hand = this.state.hand.slice();
        let remainingTiles = this.state.remainingTiles.slice();

        hand[tile]++;
        remainingTiles[tile]--;

        this.setState({
            hand,
            tilePool: pool,
            remainingTiles,
            lastDraw: tile,
            turn: this.state.turn + 1
        });
    }

    /**
     * Takes a call. The hand opens, which costs riichi and drops a closed
     * honitsu from three han to two.
     * @param {Object} call The call to make.
     */
    onCall(call) {
        let { tile, from } = this.state.pendingCall;
        let hand = this.state.hand.slice();

        let used = call.uses.map((wanted) => takeTile(hand, wanted));
        if (used.some((taken) => taken < 0)) return;

        // The called tile is displayed first and drawn rotated.
        let meld = {
            tiles: [tile].concat(used.sort((a, b) => a - b)),
            called: 0,
            kind: call.kind
        };

        let discards = this.state.discards.map((pile) => pile.slice());
        discards[from].pop();

        this.setState({
            hand,
            melds: this.state.melds.concat([meld]),
            discards,
            pendingCall: null,
            lastDraw: -1,
            showHint: false,
            // A call gives you the turn, so it advances the count the same way a
            // draw does. Without this the called discard and the next drawn one
            // share a turn number in the review.
            turn: this.state.turn + 1
        });
    }

    onPassCall() {
        let resume = this.state.opponentIndex;

        this.setState({ pendingCall: null }, () => {
            if (resume > 3) {
                this.drawTile();
            } else {
                this.runOpponents(resume);
            }
        });
    }

    /**
     * Ends the hand and works out what road it actually took, so the review can
     * compare it against the roads that were available.
     * @param {string} reason Why the hand ended.
     */
    finishHand(reason) {
        let { hand, melds, history } = this.state;
        let context = this.getContext();

        let suits = new Set();
        let addSuit = (tile) => { if (tile < 30) suits.add(Math.floor(tile / 10) * 10); };
        convertHandToTileIndexArray(hand).forEach(addSuit);
        melds.forEach((meld) => meld.tiles.forEach(addSuit));

        let isOneSuit = suits.size <= 1;
        let suitBase = suits.size === 1 ? suits.values().next().value : null;

        let value = (isOneSuit && suitBase !== null)
            ? estimateHonitsuValue(hand, melds, suitBase, context)
            : estimateSpeedValue(hand, melds, context);

        // The first turn the coach called for a commit is the moment the hand
        // was decided, so the review points straight at it.
        let shiftPoint = history.find((entry) =>
            entry.road.road === "honitsu" &&
            (entry.road.reason === "triggerA" || entry.road.reason === "triggerB"));

        this.setState({
            complete: true,
            showHint: false,
            result: {
                reason,
                isOneSuit,
                suitBase,
                value,
                shanten: this.getShanten(hand, melds),
                open: melds.length > 0,
                deviations: history.filter((entry) => !entry.followed).length,
                shiftPoint
            }
        });
    }

    /** Renders the seat, round and dora context. */
    renderContext() {
        let { t } = this.props;

        return (
            <div className="honitsuChips mb-2">
                <div className="honitsuChip">
                    <span className="honitsuChip-label">{t("honitsu.roundWind")}</span>
                    <span className="honitsuChip-value">{t(SEAT_NAMES[this.state.roundWind - 31])}</span>
                </div>
                <div className="honitsuChip">
                    <span className="honitsuChip-label">{t("honitsu.seatWind")}</span>
                    <span className="honitsuChip-value">{t(SEAT_NAMES[this.state.seatWind - 31])}</span>
                </div>
                <div className="honitsuChip">
                    <span className="honitsuChip-label">{t("honitsu.live.doraIndicator")}</span>
                    <img
                        className="honitsuChip-tile"
                        src={getTileImage(this.state.doraIndicator)}
                        alt={getTileAsText(t, this.state.doraIndicator)}
                        title={getTileAsText(t, this.state.doraIndicator)}
                    />
                </div>
                <div className="honitsuChip">
                    <span className="honitsuChip-label">{t("honitsu.live.wall")}</span>
                    <span className="honitsuChip-value">{this.state.tilePool.length}</span>
                </div>
            </div>
        );
    }

    /** Renders the call prompt, neutrally: the hint stays behind its button. */
    renderCallPrompt() {
        let { t } = this.props;
        let pending = this.state.pendingCall;

        if (!pending) return null;

        return (
            <div className="callPrompt mt-2">
                <div className="callPrompt-header">
                    <span>{t("honitsu.live.offered", { player: t(PLAYER_NAMES[pending.from]) })}</span>
                    <img
                        className="honitsuChip-tile"
                        src={getTileImage(pending.tile)}
                        alt={getTileAsText(t, pending.tile)}
                        title={getTileAsText(t, pending.tile)}
                    />
                </div>
                <div className="honitsuOptions mt-2">
                    {pending.calls.map((call, index) => (
                        <Button
                            key={index}
                            className="honitsuOption"
                            color="primary"
                            onClick={() => this.onCall(call)}
                        >
                            {call.kind === "pon"
                                ? t("honitsu.live.pon")
                                : t("honitsu.live.chi", {
                                    tiles: call.uses.map((tile) => getTileAsText(t, tile, false)).join(" ")
                                })}
                        </Button>
                    ))}
                    <Button className="honitsuOption" color="secondary" onClick={this.onPassCall}>
                        {t("honitsu.live.pass")}
                    </Button>
                </div>
            </div>
        );
    }

    /** Renders the opponents' discard piles, which is how the suit feed is read. */
    renderDiscards() {
        let { t } = this.props;

        return (
            <div className="liveDiscards mt-3">
                {this.state.discards.map((pile, index) => (
                    pile.length === 0 ? null : (
                        <div className="liveDiscards-row" key={index}>
                            <span className="liveDiscards-label">{t(PLAYER_NAMES[index])}</span>
                            <div className="liveDiscards-tiles">
                                {pile.map((tile, position) => (
                                    <img
                                        key={position}
                                        className="liveDiscards-tile"
                                        src={getTileImage(tile)}
                                        alt={getTileAsText(t, tile)}
                                        title={getTileAsText(t, tile)}
                                    />
                                ))}
                            </div>
                        </div>
                    )
                ))}
            </div>
        );
    }

    /** Renders the end-of-hand review. */
    renderResult() {
        let { t } = this.props;
        let result = this.state.result;

        if (!result) return null;

        let roadTaken = result.isOneSuit && result.suitBase !== null
            ? t("honitsu.live.tookHonitsu", { suit: t(`honitsu.live.suits.${SUIT_NAMES[result.suitBase]}`) })
            : t("honitsu.live.tookStraight");

        return (
            <div className="liveResult mt-3">
                {/* Reaching tenpai is the goal; running the wall out is not. */}
                <div className={`honitsuVerdict ${result.reason === "tenpai" ? "text-success" : "text-warning"}`}>
                    {t(`honitsu.live.ended.${result.reason}`)}
                </div>

                <div className="mt-2"><span>{roadTaken}</span></div>

                <div className="honitsuBreakdown">
                    <span className="honitsuBreakdown-label">{t("honitsu.hanBreakdown")}</span>
                    <span>{result.value.sources.join(" + ")} = {result.value.han} han</span>
                </div>

                {result.value.yakuless &&
                    <div className="liveResult-warning">{t("honitsu.live.yakulessWarning")}</div>}

                {result.value.pending && result.value.pending.length > 0 &&
                    <div className="roadHint-pending">
                        {t("honitsu.live.pending", { sources: result.value.pending.join(", ") })}
                    </div>}

                {result.shiftPoint &&
                    <div className="liveResult-shift mt-2">
                        {t("honitsu.live.shiftPoint", {
                            turn: result.shiftPoint.turn,
                            suit: t(`honitsu.live.suits.${SUIT_NAMES[result.shiftPoint.honitsuSuit]}`),
                            han: result.shiftPoint.honitsuHan,
                            ceiling: result.shiftPoint.honitsuCeiling
                        })}
                    </div>}

                <div className="mt-2">
                    <span>{t("honitsu.live.deviations", {
                        missed: result.deviations,
                        total: this.state.history.length
                    })}</span>
                </div>

                <div className="liveReview mt-2">
                    {this.state.history.map((entry, index) => (
                        <div className={`liveReview-row ${entry.followed ? "" : "liveReview-row--missed"}`} key={index}>
                            <span className="liveReview-turn">{entry.turn}</span>
                            <img
                                className="liveReview-tile"
                                src={getTileImage(entry.discarded)}
                                alt={getTileAsText(t, entry.discarded)}
                            />
                            <span className="liveReview-road">{t(`honitsu.live.roads.${entry.road.road}`)}</span>
                            {!entry.followed && entry.recommended >= 0 &&
                                <span className="liveReview-suggestion">
                                    {t("honitsu.live.wanted")}
                                    <img
                                        className="liveReview-tile"
                                        src={getTileImage(entry.recommended)}
                                        alt={getTileAsText(t, entry.recommended)}
                                    />
                                </span>}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    render() {
        let { t } = this.props;

        // The analysis is only computed when it is actually going to be shown.
        let analysis = (this.state.showHint && this.state.hand && !this.state.complete)
            ? analyzeHand(this.state.hand, this.state.melds, this.state.remainingTiles, this.getContext())
            : null;

        return (
            <div className="liveView">
                <Row className="mb-2">
                    <Col xs="6" sm="4" className="px-1">
                        <Button className="btn-block" color="warning" onClick={this.onNewHand}>
                            {t("honitsu.live.newHand")}
                        </Button>
                    </Col>
                    <Col xs="6" sm="4" className="px-1">
                        <Button
                            className="btn-block"
                            color="info"
                            disabled={this.state.complete}
                            onClick={this.toggleHint}
                        >
                            {this.state.showHint ? t("honitsu.live.hideHint") : t("honitsu.live.hint")}
                        </Button>
                    </Col>
                </Row>

                {this.renderContext()}

                <Row className="mb-1">
                    <Col xs="12">
                        <span className="honitsuNote">
                            {this.state.complete
                                ? t("honitsu.live.completeInstructions")
                                : this.state.pendingCall
                                    ? t("honitsu.live.callInstructions")
                                    : t("honitsu.live.instructions")}
                        </span>
                    </Col>
                </Row>

                <LiveHand
                    hand={this.state.hand}
                    melds={this.state.melds}
                    lastDraw={this.state.lastDraw}
                    onTileClick={this.state.complete || this.state.pendingCall ? null : this.onTileClicked}
                />

                {this.renderCallPrompt()}
                {analysis && <RoadHint analysis={analysis} />}
                {this.renderResult()}
                {this.renderDiscards()}
            </div>
        );
    }
}

export default withTranslation()(HonitsuLive);
