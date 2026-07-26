import React from 'react';
import { Button, Collapse, Row, Col, Table } from 'reactstrap';
import { withTranslation } from 'react-i18next';

/**
 * Shows how the user is doing per rule rather than per item.
 *
 * Tracking rules is the point: the item bank is small enough to memorise, so
 * "I get bakahon right" is a meaningful measure where "I remember c-07" is not.
 * The worst rules are listed first, because those are the ones to drill.
 */
class HonitsuStats extends React.Component {
    constructor(props) {
        super(props);
        this.toggle = this.toggle.bind(this);
        this.state = { open: false };
    }

    toggle() {
        this.setState({ open: !this.state.open });
    }

    /**
     * Turns a rule key such as "never-2-bakahon" into readable text, which
     * avoids a translation key per rule for what is already English-only
     * authored content.
     * @param {string} rule The rule key.
     * @returns {string} The readable label.
     */
    formatRule(rule) {
        return rule.replace(/-/g, " ");
    }

    render() {
        let { t, stats, onReset } = this.props;
        let rules = Object.keys(stats.rules || {});

        let total = rules.reduce((sum, rule) => sum + stats.rules[rule].total, 0);
        let correct = rules.reduce((sum, rule) => sum + stats.rules[rule].correct, 0);
        let percent = total > 0 ? Math.round((correct / total) * 100) : 0;

        // Worst first, so the list opens on whatever needs work.
        let sorted = rules.slice().sort((a, b) => {
            let rateA = stats.rules[a].correct / stats.rules[a].total;
            let rateB = stats.rules[b].correct / stats.rules[b].total;
            return rateA - rateB;
        });

        return (
            <div className="mb-2">
                <Button color="primary" onClick={this.toggle}>{t("honitsu.stats.buttonLabel")}</Button>
                <Collapse isOpen={this.state.open}>
                    <Row className="mt-2">
                        <Col xs="12">
                            <span>{t("honitsu.stats.overall", { correct, total, percent })}</span>
                        </Col>
                    </Row>
                    {sorted.length > 0 &&
                        <Table size="sm" className="mt-2 honitsuStatsTable">
                            <thead>
                                <tr>
                                    <th>{t("honitsu.stats.rule")}</th>
                                    <th>{t("honitsu.stats.score")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sorted.map((rule) => (
                                    <tr key={rule}>
                                        <td>{this.formatRule(rule)}</td>
                                        <td>{stats.rules[rule].correct} / {stats.rules[rule].total}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>}
                    <Button color="danger" size="sm" onClick={onReset}>{t("honitsu.stats.reset")}</Button>
                </Collapse>
            </div>
        );
    }
}

export default withTranslation()(HonitsuStats);
