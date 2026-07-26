import React from 'react';
import { Container, Row, Col, Button, Input, Label, FormGroup } from 'reactstrap';
import HonitsuItemCard from '../components/honitsu-trainer/HonitsuItemCard';
import HonitsuStats from '../components/honitsu-trainer/HonitsuStats';
import HonitsuLive from './HonitsuLive';
import { buildDeck, prepareItem, getRuleKey, DRILL_TYPES } from '../scripts/HonitsuItems';
import { generateValueItem } from '../scripts/HonitsuValue';
import { withTranslation } from 'react-i18next';

const STATS_KEY = "honitsuStats";
const SETTINGS_KEY = "honitsuSettings";

/** @readonly The live mode plays a hand out instead of asking a drill question. */
const LIVE_MODE = "live";

/** @readonly Every mode offered, drills first. */
const MODES = DRILL_TYPES.concat([LIVE_MODE]);

/**
 * The honitsu drill.
 *
 * Deliberately shares no state with the efficiency trainer: the two teach
 * different things, and mixing routing decisions into tile efficiency would
 * muddy both. Each item is a self-contained question, so nothing here reads the
 * efficiency trainer's hand generation settings.
 */
class HonitsuTrainer extends React.Component {
    constructor(props) {
        super(props);

        this.onAnswer = this.onAnswer.bind(this);
        this.onNext = this.onNext.bind(this);
        this.onResetStats = this.onResetStats.bind(this);
        this.onSettingChanged = this.onSettingChanged.bind(this);

        this.state = {
            mode: DRILL_TYPES[0],
            deck: [],
            item: null,
            chosen: null,
            answered: false,
            generatedCount: 0,
            settings: { mirrorSuits: true },
            stats: { rules: {} }
        };
    }

    componentDidMount() {
        let stats = this.state.stats;
        let settings = this.state.settings;

        try {
            let savedStats = window.localStorage.getItem(STATS_KEY);
            if (savedStats) {
                stats = { rules: {}, ...JSON.parse(savedStats) };
            }

            let savedSettings = window.localStorage.getItem(SETTINGS_KEY);
            if (savedSettings) {
                settings = { ...settings, ...JSON.parse(savedSettings) };
            }
        } catch (error) {
            // A corrupt or unavailable store should not stop the drill.
        }

        this.setState({ stats, settings }, () => this.startMode(this.state.mode));
    }

    /**
     * Starts a drill mode with a freshly shuffled deck.
     * @param {string} mode The drill type to start.
     */
    startMode(mode) {
        // The live mode plays a hand out and keeps its own state.
        if (mode === LIVE_MODE) {
            this.setState({ mode, deck: [], item: null, chosen: null, answered: false });
            return;
        }

        let deck = buildDeck(mode);
        this.setState({ mode, deck }, () => this.drawNextItem());
    }

    /**
     * Takes the next item from the deck, preparing it for display.
     *
     * The value gate never runs out: once the authored items are spent it falls
     * through to generated ones, which is why they exist.
     */
    drawNextItem() {
        let { deck, mode, settings, generatedCount } = this.state;

        if (deck.length > 0) {
            let remaining = deck.slice();
            let next = remaining.shift();

            this.setState({
                deck: remaining,
                item: prepareItem(next, settings.mirrorSuits),
                chosen: null,
                answered: false
            });
            return;
        }

        if (mode === "value_gate") {
            let generated = generateValueItem(generatedCount + 1);

            if (generated) {
                this.setState({
                    item: generated,
                    chosen: null,
                    answered: false,
                    generatedCount: generatedCount + 1
                });
                return;
            }
        }

        // Every authored item has been seen, so reshuffle and go around again.
        this.startMode(mode);
    }

    /**
     * Records an answer and reveals the explanation.
     * @param {Object} option The option the user picked.
     */
    onAnswer(option) {
        if (this.state.answered) return;

        let { item, stats } = this.state;
        let rule = getRuleKey(item);
        let rules = { ...stats.rules };
        let entry = rules[rule] || { correct: 0, total: 0 };

        rules[rule] = {
            correct: entry.correct + (option.correct ? 1 : 0),
            total: entry.total + 1
        };

        let updated = { rules };

        try {
            window.localStorage.setItem(STATS_KEY, JSON.stringify(updated));
        } catch (error) {
            // Losing the running total is not worth interrupting the drill for.
        }

        this.setState({ chosen: option, answered: true, stats: updated });
    }

    onNext() {
        this.drawNextItem();
    }

    onResetStats() {
        let cleared = { rules: {} };

        try {
            window.localStorage.setItem(STATS_KEY, JSON.stringify(cleared));
        } catch (error) {
            // Ignore an unavailable store.
        }

        this.setState({ stats: cleared });
    }

    /**
     * Updates a setting and restarts the current mode, so the change applies to
     * the item on screen rather than only to the next one.
     * @param {Object} event The change event from the setting's control.
     */
    onSettingChanged(event) {
        let settings = { ...this.state.settings, [event.target.id]: event.target.checked };

        try {
            window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        } catch (error) {
            // Ignore an unavailable store.
        }

        this.setState({ settings }, () => this.startMode(this.state.mode));
    }

    render() {
        let { t } = this.props;
        let { mode, item, chosen, answered, stats, settings } = this.state;
        let isLive = mode === LIVE_MODE;

        return (
            <Container className="trainer-container">
                <Row className="mb-2">
                    {MODES.map((type) => (
                        <Col xs="6" sm="3" key={type} className="px-1 mb-1">
                            <Button
                                className="btn-block honitsuMode"
                                color={mode === type ? "success" : "secondary"}
                                disabled={mode === type}
                                onClick={() => this.startMode(type)}
                            >
                                {t(`honitsu.modes.${type}`)}
                            </Button>
                        </Col>
                    ))}
                </Row>

                <Row className="mb-2">
                    <Col xs="12">
                        <span className="honitsuNote">{t(`honitsu.instructions.${mode}`)}</span>
                    </Col>
                </Row>

                {/* The drill's progress and disguise settings have nothing to
                    act on while a hand is being played out. */}
                {!isLive &&
                    <React.Fragment>
                        <HonitsuStats stats={stats} onReset={this.onResetStats} />

                        <FormGroup check className="mb-2">
                            <Label check>
                                <Input
                                    type="checkbox"
                                    id="mirrorSuits"
                                    checked={settings.mirrorSuits}
                                    onChange={this.onSettingChanged}
                                />
                                <span>{t("honitsu.mirrorSuits")}</span>
                            </Label>
                        </FormGroup>
                    </React.Fragment>}

                {isLive
                    ? <HonitsuLive />
                    : <HonitsuItemCard
                        item={item}
                        chosen={chosen}
                        answered={answered}
                        onAnswer={this.onAnswer}
                        onNext={this.onNext}
                    />}
            </Container>
        );
    }
}

export default withTranslation()(HonitsuTrainer);
