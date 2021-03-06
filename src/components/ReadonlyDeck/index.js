import React, { PureComponent, lazy } from 'react'
import classnames from 'classnames'
import {
    cardTypeIcons,
    idPrefixToFaction,
    cardType,
    totalCardsPerWave,
    factions,
    restrictedCards,
    bannedCards,
} from '../../data/index'
import { pickCardColor, checkDeckValidFormats, ignoreAsDublicate } from '../../utils/functions'
import { Set } from 'immutable'
import DeckIcon from '../../atoms/DeckIcon'
import { withStyles } from '@material-ui/core/styles'
import SetsList from '../../atoms/SetsList'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { SET_EDIT_MODE_SETS } from '../../reducers/cardLibraryFilters'
import ScoringOverview from '../../atoms/ScoringOverview'
import {
    EDIT_ADD_CARD,
    EDIT_DECK_NAME,
    EDIT_DECK_DESCRIPTION,
    EDIT_FACTION,
    EDIT_RESET_DECK,
} from '../../reducers/deckUnderEdit'
import b64toBlob from 'b64-to-blob'
import Card from './atoms/Card'
import { Typography } from '@material-ui/core'
import LockIcon from '@material-ui/icons/Lock'
import NotInterestedIcon from '@material-ui/icons/NotInterested'
import * as ROUTES from '../../constants/routes';
import PlayFormatsValidity from '../../atoms/PlayFormatsValidity'
import DetailedPlayStyleValidity from '../../atoms/DetailedPlayStyleValidity'
import * as clipboard from "clipboard-polyfill"

const DeckActionsMenu = lazy(() => import('./atoms/DeckActionsMenu'))
const DeckActionMenuLarge = lazy(() => import('./atoms/DeckActionsMenuLarge'))

const MiniSectionHeader = ({ type, amount, children }) => (
    <div
        style={{
            borderBottom: '1px solid gray',
            margin: '1rem .5rem 1rem .5rem',
            padding: '0 0 .3rem 0',
            display: 'flex',
            alignItems: 'center',
        }}
    >
        <img
            src={`/assets/icons/${cardTypeIcons[type]}.png`}
            alt={cardTypeIcons[type]}
            style={{
                margin: '0 .3rem 0 .5rem',
                width: '1.5rem',
                height: '1.5rem',
            }}
        />
        <div
            style={{
                fontFamily: 'roboto',
                fontSize: '1.2rem',
                margin: '0 .3rem 0 0',
            }}
        >
            {`${amount} ${cardType[type]}s`}
        </div>
        <div style={{ display: 'flex', margin: '0 0 0 0' }}>{children}</div>
    </div>
)

const idToPrintId = id => {
    const wavePrefix = id.substr(0, 2)
    return `${id.slice(-3)}/${totalCardsPerWave[parseInt(wavePrefix, 10)]}`
}

const cardWidthPx = 532 / 2
const cardHeightPx = 744 / 2

const calcCanvasSize = cards => {
    const objectives = cards.toJS().filter(c => c.type === 0)
    const gambits = cards.toJS().filter(c => c.type === 1 || c.type === 3)
    const upgrades = cards.toJS().filter(c => c.type === 2)

    const objectivesWidth = 4 * (cardWidthPx + 10)
    const gambitsWidth = 4 * (cardWidthPx + 10)
    const upgradesWidth = 4 * (cardWidthPx + 10)

    const width = objectivesWidth + 21 + gambitsWidth + 21 + upgradesWidth

    const objectivesHeight =
        Math.ceil(objectives.length / 4) * (cardHeightPx + 10)
    const gambitsHeight = Math.ceil(gambits.length / 4) * (cardHeightPx + 10)
    const upgradesHeight = Math.ceil(upgrades.length / 4) * (cardHeightPx + 10)

    const height =
        Math.max(objectivesHeight, gambitsHeight, upgradesHeight) + 20

    return {
        width: width,
        height: height,
    }
}

const styles = theme => ({
    root: {
        display: 'flex',
        flexFlow: 'column',
    },

    deckHeader: {
        display: 'flex',
        margin: '1rem 0 0 .5rem',
    },

    deckHeaderMenu: {
        [theme.breakpoints.up('lg')]: {
            display: 'none',
        },
    },

    deckHeaderButtons: {
        display: 'none',
        [theme.breakpoints.up('lg')]: {
            display: 'flex',
            margin: '0 1rem 0 0',
        },
    },

    deckBody: {
        display: 'flex',
        flexFlow: 'row wrap',
        [theme.breakpoints.up('lg')]: {
            flexFlow: 'row wrap',
            justifyContent: 'space-around',
        },
    },

    section: {
        flex: '1 100%',
        [theme.breakpoints.up('lg')]: {
            flex: '1 1 calc(100% / 3)',
        },
    },

    sectionItems: {
        display: 'flex',
        flexFlow: 'column nowrap',
    },

    cardsSectionItems: {
        display: 'flex',
        flexFlow: 'row wrap',
        justifyContent: 'center',
    },

    cardsSection: {
        flex: '1 100%',
    },
})

function DeckSummary({
    factionPrefix,
    name,
    author,
    date,
    draft,
    sets,
    amount,
    playFormats,
}) {
    return (
        <React.Fragment>
            <DeckIcon
                width="4rem"
                height="4rem"
                faction={idPrefixToFaction[factionPrefix]}
            />
            <div style={{ flex: '1 1 auto' }}>
                <div
                    style={{
                        fontFamily: 'roboto',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                    }}
                >
                    {name}
                </div>
                <div style={{ fontFamily: 'roboto', fontSize: '.7rem' }}>
                    <span>{author}</span>
                    <span>{date}</span>
                    <span style={{ color: 'darkorange' }}>{draft}</span>
                </div>
                <div style={{ margin: '.2rem 0 0 0' }}>
                    {<SetsList sets={sets} />}
                </div>
                <div
                    style={{
                        margin: '.2rem 0 0 0',
                        display: 'flex',
                        alignItems: 'center',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItem: 'center',
                            marginRight: '.3rem',
                        }}
                    >
                        <img alt="objective-icon"
                            src={`/assets/icons/objective-icon.png`}
                            style={{ width: '1rem', height: '1rem' }}
                        />
                        <Typography>{amount && amount.objectives}</Typography>
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            alignItem: 'center',
                            marginRight: '.3rem',
                        }}
                    >
                        <img alt="ploy-icon"
                            src={`/assets/icons/ploy-icon.png`}
                            style={{ width: '1rem', height: '1rem' }}
                        />
                        <img alt="gambit spell-icon"
                            src={`/assets/icons/gambit spell-icon.png`}
                            style={{ width: '1rem', height: '1rem' }}
                        />
                        <Typography>{amount && amount.gambits}</Typography>
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            alignItem: 'center',
                            marginRight: '.3rem',
                        }}
                    >
                        <img alt="upgrade-icon"
                            src={`/assets/icons/upgrade-icon.png`}
                            style={{ width: '1rem', height: '1rem' }}
                        />
                        <Typography>{amount && amount.upgrades}</Typography>
                    </div>
                </div>
            </div>
        </React.Fragment>
    )
}

class ReadonlyDeck extends PureComponent {
    state = {
        deckCanvasSize: { width: 0, height: 0 },
        isDraft: false,
    }

    componentDidMount = () => {
        const cards = this.props.cards.toJS()
        const counts = cards.reduce(
            (acc, el) => {
                switch (el.type) {
                    case 0:
                        acc.objectives += 1
                        return acc

                    case 2:
                        acc.upgrades += 1
                        return acc

                    default:
                        acc.gambits += 1
                        return acc
                }
            },
            {
                objectives: 0,
                gambits: 0,
                upgrades: 0,
            }
        )

        this.setState({
            deckCanvasSize: calcCanvasSize(this.props.cards),
            isDraft:
                counts.objectives < 12 ||
                counts.upgrades + counts.gambits < 20 ||
                counts.gambits > counts.upgrades,
        })
    }

    render() {
        const {
            classes,
            name,
            author,
            factionId,
            cards,
            sets,
            created,
            isNarrow,
        } = this.props
        const objectives = cards
            .filter(v => v.type === 0)
            .sort((a, b) => a.name.localeCompare(b.name))
        const gambits = cards
            .filter(v => v.type === 1 || v.type === 3)
            .sort((a, b) => a.name.localeCompare(b.name))
        const upgrades = cards
            .filter(v => v.type === 2)
            .sort((a, b) => a.name.localeCompare(b.name))
        const spellsCount = gambits.filter(v => v.type === 3).count()

        const createdDate = created
            ? ` | ${new Date(created).toLocaleDateString()}`
            : ''
        const draft = this.state.isDraft ? ` | Draft` : ''
        const objectiveSummary = new Set(objectives)
            .groupBy(c => c.scoreType)
            .reduce(
                (r, v, k) => {
                    r[k] = v.count()
                    return r
                },
                [0, 0, 0, 0]
            )

        const restrictedCount = cards
            .toJS()
            .map(c => Boolean(restrictedCards[c.id]))
            .filter(c => c === true).length
        const bannedCount = cards
            .map(c => Boolean(bannedCards[c.id]))
            .filter(c => c === true)
            .count()
        const rotatedOutCount = cards
            .filter(c => c.faction === 0 && Number(c.id) < 3000 && !ignoreAsDublicate(c.name))
            .count()

        const amount = {
            objectives: objectives.toJS().length,
            gambits: gambits.toJS().length,
            upgrades: upgrades.toJS().length,
            restricted: restrictedCount,
            banned: bannedCount,
            rotatedOut: rotatedOutCount,
        }

        const totalGlory = objectives.reduce(
            (acc, c) => acc + Number(c.glory),
            0
        )

        const playFormats = checkDeckValidFormats(cards.map(c => c.id).toJS());

        return (
            <div className={classes.root}>
                <div className={classes.deckHeader}>
                    <DeckSummary
                        factionPrefix={factionId}
                        name={name}
                        author={author}
                        date={createdDate}
                        draft={draft}
                        sets={sets}
                        amount={amount}
                    />
                    {isNarrow && (
                        <div>
                            <DeckActionsMenu
                                onSaveAsPdf={this._handleSaveAsPdf}
                                onSaveText={this._handleSaveText}
                                onSaveImage={this._handleSaveImage}
                                canUpdateOrDelete={this.props.canUpdateOrDelete}
                                onSaveVassalFiles={this._handleSaveVassalFiles}
                                onEdit={this.props.onEdit}
                                onCopy={this.props.onCopy}
                                exportToUDB={this._handleExportToUDB}
                                exportToUDS={this._handleExportToUDS}
                                exportToClub={this._handleExportToClub}
                                onDelete={this.props.onDelete}
                                exportToGamesAssistant={this._handleExportToGamesAssistant}
                            />
                        </div>
                    )}
                    {!isNarrow && (
                        <React.Fragment>
                            <div className={classes.deckHeaderMenu}>
                                <DeckActionsMenu
                                    onSaveAsPdf={this._handleSaveAsPdf}
                                    onSaveText={this._handleSaveText}
                                    onSaveImage={this._handleSaveImage}
                                    onSaveVassalFiles={
                                        this._handleSaveVassalFiles
                                    }
                                    canUpdateOrDelete={
                                        this.props.canUpdateOrDelete
                                    }
                                    onEdit={this.props.onEdit}
                                    onCopy={this.props.onCopy}
                                    exportToUDB={this._handleExportToUDB}
                                    exportToUDS={this._handleExportToUDS}
                                    exportToClub={this._handleExportToClub}
                                    onDelete={this.props.onDelete}
                                    exportToGamesAssistant={this._handleExportToGamesAssistant}
                                />
                            </div>
                            <div className={classes.deckHeaderButtons}>
                                <DeckActionMenuLarge
                                    cardsView={this.props.cardsView}
                                    onCardsViewChange={
                                        this.props.onCardsViewChange
                                    }
                                    onSaveAsPdf={this._handleSaveAsPdf}
                                    onSaveText={this._handleSaveText}
                                    onSaveImage={this._handleSaveImage}
                                    onSaveVassalFiles={
                                        this._handleSaveVassalFiles
                                    }
                                    canUpdateOrDelete={
                                        this.props.canUpdateOrDelete
                                    }
                                    onEdit={this.props.onEdit}
                                    onCopy={this.props.onCopy}
                                    exportToUDB={this._handleExportToUDB}
                                    exportToUDS={this._handleExportToUDS}
                                    exportToClub={this._handleExportToClub}
                                    onDelete={this.props.onDelete}
                                />
                            </div>
                        </React.Fragment>
                    )}
                </div>

                <DetailedPlayStyleValidity validFormats={playFormats} cards={cards.map(c => c.id).toJS()} />

                <div className={classes.deckBody}>
                    <div
                        className={classnames(classes.section, {
                            [classes.cardsSection]: this.props.cardsView,
                        })}
                        style={{ flex: isNarrow ? '1 100%' : '' }}
                    >
                        <MiniSectionHeader
                            type={0}
                            amount={objectives.toJS().length}
                        >
                            <div style={{ display: 'flex' }}>
                                <div style={{ display: 'flex' }}>
                                    <ScoringOverview
                                        summary={objectiveSummary}
                                        glory={totalGlory}
                                    />
                                </div>
                            </div>
                        </MiniSectionHeader>
                        <div
                            className={classnames(classes.sectionItems, {
                                [classes.cardsSectionItems]: this.props
                                    .cardsView,
                            })}
                        >
                            {objectives.toJS().map((v, i) => (
                                <Card
                                    key={i}
                                    card={v}
                                    asImage={this.props.cardsView}
                                />
                            ))}
                        </div>
                    </div>

                    <div
                        className={classnames(classes.section, {
                            [classes.cardsSection]: this.props.cardsView,
                        })}
                        style={{ flex: isNarrow ? '1 100%' : '' }}
                    >
                        <div
                            style={{
                                borderBottom: '1px solid gray',
                                margin: '1rem .5rem 1rem .5rem',
                                padding: '0 0 .3rem 0',
                                display: 'flex',
                                alignItems: 'center',
                            }}
                        >
                            <img
                                src={`/assets/icons/${cardTypeIcons[1]}.png`}
                                alt={cardTypeIcons[1]}
                                style={{
                                    margin: '0 0 0 .5rem',
                                    width: '1.5rem',
                                    height: '1.5rem',
                                }}
                            />
                            {spellsCount > 0 && (
                                <img
                                    src={`/assets/icons/${
                                        cardTypeIcons[3]
                                    }.png`}
                                    alt={cardTypeIcons[3]}
                                    style={{
                                        margin: '0 .3rem 0 .3rem',
                                        width: '1.5rem',
                                        height: '1.5rem',
                                    }}
                                />
                            )}
                            <div
                                style={{
                                    fontFamily: 'roboto',
                                    fontSize: '1.2rem',
                                    margin: '0 .3rem 0 .3rem',
                                }}
                            >
                                {`${gambits.toJS().length} Gambits`}
                            </div>
                        </div>
                        <div
                            className={classnames(classes.sectionItems, {
                                [classes.cardsSectionItems]: this.props
                                    .cardsView,
                            })}
                        >
                            {gambits.toJS().map((v, i) => (
                                <Card
                                    key={i}
                                    card={v}
                                    asImage={this.props.cardsView}
                                />
                            ))}
                        </div>
                    </div>
                    <div
                        className={classnames(classes.section, {
                            [classes.cardsSection]: this.props.cardsView,
                        })}
                        style={{ flex: isNarrow ? '1 100%' : '' }}
                    >
                        <MiniSectionHeader
                            type={2}
                            amount={upgrades.toJS().length}
                        />
                        <div
                            className={classnames(classes.sectionItems, {
                                [classes.cardsSectionItems]: this.props
                                    .cardsView,
                            })}
                        >
                            {upgrades.toJS().map((v, i) => (
                                <Card
                                    key={i}
                                    card={v}
                                    asImage={this.props.cardsView}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* for exports */}
                <div
                    id="pdf-export-elements"
                    style={{
                        position: 'fixed',
                        left: 50000,
                        top: 0,
                        zIndex: 100,
                    }}
                >
                    <img
                        id="factionDeckIcon"
                        src={`/assets/icons/${idPrefixToFaction[factionId]}-deck.png`}
                        alt="factionDeckIcon"
                    />
                    <img
                        id="wave-01"
                        src={`/assets/icons/wave-01-icon.png`}
                        alt="wave-01"
                    />
                    <img
                        id="wave-02"
                        src={`/assets/icons/wave-02-icon.png`}
                        alt="wave-02"
                    />
                    <img
                        id="wave-03"
                        src={`/assets/icons/wave-03-icon.png`}
                        alt="wave-03"
                    />
                    <img
                        id="wave-04"
                        src={`/assets/icons/wave-04-icon.png`}
                        alt="wave-04"
                    />
                    <img
                        id="wave-05"
                        src={`/assets/icons/wave-05-icon.png`}
                        alt="wave-05"
                    />
                    <img
                        id="wave-06"
                        src={`/assets/icons/wave-06-icon.png`}
                        alt="wave-05"
                    />
                    <img
                        id="wave-07"
                        src={`/assets/icons/wave-07-icon.png`}
                        alt="wave-05"
                    />
                    <img
                        id="op_valid"
                        src={`/assets/icons/ApprovedStamp.png`}
                        alt="Organized Play Approved Stamp"
                    />
                    <img
                        id="op_not_valid"
                        src={`/assets/icons/NotValidStamp.png`}
                        alt="Organized Play Denied Stamp"
                    />
                    <img
                        id="restrictedIcon"
                        src={`/assets/icons/restricted_card_icon.png`}
                        alt="Restricted Icon"
                    />
                    <div
                        id="textMeasureContainer"
                        style={{
                            display: 'inline-flex',
                            backgroundColor: 'magenta',
                            flexFlow: 'column',
                            width: 'auto',
                        }}
                    >
                        {cards.map(c => {
                            return (
                                <div
                                    key={`card-${c.id}`}
                                    style={{
                                        fontFamily: 'Helvetica',
                                        fontSize: '.5rem',
                                        width: 'auto',
                                    }}
                                    id={`card-${c.id}`}
                                >
                                    {c.type === 0
                                        ? ` - ${c.name} (${c.glory})`
                                        : `- ${c.name}`}
                                </div>
                            )
                        })}
                    </div>
                    <div
                        id="cardNumberMeasurer"
                        style={{
                            display: 'inline-flex',
                            backgroundColor: 'magenta',
                            flexFlow: 'column',
                            fontFamily: 'Helvetica',
                            fontSize: '.5rem',
                        }}
                    >
                        000/000
                    </div>
                    <div id="cardsPreloadedImages">
                        {cards.map(c => (
                            <img
                                key={c.id}
                                id={`card_${c.id}`}
                                src={`/assets/cards/${c.id}.png`}
                            />
                        ))}
                    </div>
                    <div>
                        <canvas
                            id="deckCanvas"
                            width={this.state.deckCanvasSize.width}
                            height={this.state.deckCanvasSize.height}
                        ></canvas>
                    </div>
                </div>
            </div>
        )
    }

    _handleSaveAsPdf = () => {
        import('jspdf').then(({ default: jsPDF }) => {
            const { name, author, created, cards } = this.props
            const objectives = cards
                .filter(v => v.type === 0)
                .sort((a, b) => a.name.localeCompare(b.name))
            const gambits = cards
                .filter(v => v.type === 1 || v.type === 3)
                .sort((a, b) => a.name.localeCompare(b.name))
            const upgrades = cards
                .filter(v => v.type === 2)
                .sort((a, b) => a.name.localeCompare(b.name))

            let doc = new jsPDF({
                unit: 'px',
            })

            let docX = 20
            let docY = 10
            const rem = 16
            doc.addImage(
                document.getElementById('factionDeckIcon'),
                'png',
                docX,
                docY,
                rem * 1.5,
                rem * 1.5,
                '',
                'SLOW'
            )

            // Header
            docX = docX + rem * 2
            docY = docY + 10
            doc.setFont('Helvetica', '')
            doc.setFontSize(rem)
            doc.text(name, docX, docY)
            doc.setFontSize(rem * 0.5)
            docY = docY + rem * 0.5
            doc.setTextColor('#BCBDC0')
            doc.text(
                `${author} ${
                    created
                        ? ` | ${new Date(created).toLocaleDateString()}`
                        : ''
                }`,
                docX,
                docY
            )

            let coords = this.addToPdf(
                doc,
                'Objectives (12):',
                objectives,
                docX,
                docY,
                rem
            )
            coords = this.addToPdf(
                doc,
                `Gambits (${gambits.count()}):`,
                gambits,
                coords.x,
                coords.y,
                rem
            )
            coords = this.addToPdf(
                doc,
                `Upgrades (${upgrades.count()}):`,
                upgrades,
                coords.x,
                coords.y,
                rem
            )

            const objs = objectives.toJS().map(c => c.id)
            const gs = gambits.toJS().map(c => c.id)
            const us = upgrades.toJS().map(c => c.id)
            const barCount = [...objs, ...gs, ...us].filter(
                id => Boolean(restrictedCards[id]) || Boolean(bannedCards[id])
            ).length
            const isOrganizedPlayValid =
                objs.length === 12 &&
                gs.length <= us.length &&
                gs.length + us.length >= 20 &&
                barCount <= 5

            const measuredWidth = document.getElementById(
                `textMeasureContainer`
            ).clientWidth
            const otherMeasuredWidth = document.getElementById(
                `cardNumberMeasurer`
            ).clientWidth
            if (isOrganizedPlayValid) {
                doc.addImage(
                    document.getElementById('op_valid'),
                    'png',
                    coords.x + measuredWidth + otherMeasuredWidth + rem * 2,
                    coords.y,
                    rem * 8,
                    rem * 8,
                    '',
                    'SLOW'
                )
            } else {
                doc.addImage(
                    document.getElementById('op_not_valid'),
                    'png',
                    coords.x + measuredWidth + otherMeasuredWidth + rem * 2,
                    coords.y,
                    rem * 8,
                    rem * 8,
                    '',
                    'SLOW'
                )
            }

            doc.save(`${name}.pdf`)
        })
    }

    addToPdf = (doc, header, cards, docX, docY, rem) => {
        docX = 20
        docY = docY + rem * 2
        doc.setFont('Helvetica', 'bold')
        doc.setFontSize(rem * 0.8)
        doc.setTextColor('black')
        doc.text(header, docX, docY)

        docX = 20
        docY = docY + rem * 0.5
        doc.setFont('Helvetica', '')
        doc.setFontSize(rem * 0.6)
        // doc.setTextColor('black');
        for (let card of cards) {
            doc.addImage(
                document.getElementById(card.id),
                'png',
                docX,
                docY - 2,
                8,
                8
            )
            doc.setTextColor(pickCardColor(card.id))
            const text = card.hasOwnProperty('glory')
                ? ` - ${card.name} (${card.glory})`
                : ` - ${card.name}`
            doc.text(text, docX + 10, docY + 5)
            doc.setTextColor('#BCBDC0')
            const measuredWidth = document.getElementById(
                `textMeasureContainer`
            ).clientWidth
            doc.text(
                `${idToPrintId(card.id)}`,
                docX + 10 + measuredWidth,
                docY + 5
            )
            const otherMeasuredWidth = document.getElementById(
                `cardNumberMeasurer`
            ).clientWidth
            doc.addImage(
                document.getElementById(`wave-${card.id.substr(0, 2)}`),
                'png',
                docX + 10 + measuredWidth + otherMeasuredWidth,
                docY - 2,
                8,
                8
            )
            if (Boolean(restrictedCards[card.id])) {
                doc.addImage(
                    document.getElementById('restrictedIcon'),
                    'png',
                    docX + 10 + measuredWidth + otherMeasuredWidth + 10,
                    docY - 2,
                    8,
                    8
                )
            }
            docY += 10
            doc.setTextColor('black')
        }

        const coords = { x: docX, y: docY }
        return coords
    }

    _handleSaveVassalFiles = () => {
        const { id, name, cards } = this.props
        const cardsjs = cards.toJS()

        const objectives = cardsjs
            .filter(c => c.type === 0)
            .map(
                (c, i) =>
                    String.fromCharCode(27) + `+/1574121945748/macro;Make playerside 2;;74,715;PlayerSide = PLAYER 2 && PlayerOwnership = NONE;;40\\,130;false;;;counted;;;;false;;1;1\tmacro;Make playerside 1;;74,715;PlayerSide = PLAYER 1 && PlayerOwnership = NONE;;35\\,130;false;;;counted;;;;false;;1;1\\\tPROP;PlayerOwnership;false,0,100,false;:35\\,130:P\\,PLAYER1,:40\\,130:P\\,PLAYER2\\\\\tmacro;p2 return to deck;;72,130;PlayerOwnership = PLAYER2;;98\\,130;false;;;counted;;;;false;;1;1\\\\\\\tmacro;p1 return to deck;;72,130;PlayerOwnership = PLAYER1;;97\\,130;false;;;counted;;;;false;;1;1\\\\\\\\\treturn;;98,130;OBJECTIVE CARDS RIGHT WIDE;Select destination\\\\\\\\\\\treturn;;97,130;OBJECTIVE CARDS LEFT WIDE;Select destination\\\\\\\\\\\\\tobs;70,130;Objectives background.png;REVEAL;GHiddnoverlay 2.png;?;player:;Peek\\\\\\\\\\\\\\\treport;68\\,195;$PlayerName$ Deleted: $PieceName$;;;INFORME TIRADA\\\\\\\\\\\\\\\\\tmark;MapLayers\\\\\\\\\\\\\\\\\\\tdelete;Delete;68,195\\\\\\\\\\\\\\\\\\\\\tpiece;;;${c.id}.png;${c.id}/\t\\\tNONE\\\\\t\\\\\\\t\\\\\\\\\t\\\\\\\\\\\t\\\\\\\\\\\\\tnull;\\\\\\\\\\\\\\\t-1\\\\\\\\\\\\\\\\\tCardsLayers\\\\\\\\\\\\\\\\\\\t\\\\\\\\\\\\\\\\\\\\\tnull;2852;244;0`
            )

        this.downloadVassalDeckWithTempLink(
            objectives,
            `${name}_OBJECTIVES.txt`
        )

        const powers = cardsjs
            .filter(c => c.type !== 0)
            .map(
                (c, i) =>
                    String.fromCharCode(27) + `+/1574121930992/macro;Make playerside 2;;74,715;PlayerSide = PLAYER 2 && PlayerOwnership = NONE;;40\\,130;false;;;counted;;;;false;;1;1\tmacro;Make playerside 1;;74,715;PlayerSide = PLAYER 1 && PlayerOwnership = NONE;;35\\,130;false;;;counted;;;;false;;1;1\\\tPROP;PlayerOwnership;false,0,100,false;:35\\,130:P\\,PLAYER1,:40\\,130:P\\,PLAYER2\\\\\treport;74\\,715;$location$: $newPieceName$ *;;;\\\\\\\tmacro;p2 return to deck;;72,130;PlayerOwnership = PLAYER2;;98\\,130;false;;;counted;;;;false;;1;1\\\\\\\\\tmacro;p1 return to deck;;72,130;PlayerOwnership = PLAYER1;;97\\,130;false;;;counted;;;;false;;1;1\\\\\\\\\\\treturn;;98,130;POWER CARDS RIGHT WIDE;Select destination\\\\\\\\\\\\\treturn;;97,130;POWER CARDS LEFT WIDE;Select destination\\\\\\\\\\\\\\\tobs;70,130;powercardsback.png;REVEAL;GHiddnoverlay 2.png;?;player:;Peek\\\\\\\\\\\\\\\\\treport;68\\,195;$PlayerName$ Deleted: $PieceName$;;;INFORME TIRADA\\\\\\\\\\\\\\\\\\\tmark;MapLayers\\\\\\\\\\\\\\\\\\\\\tdelete;Delete;68,195\\\\\\\\\\\\\\\\\\\\\\\tpiece;;;${c.id}.png;${c.id}/\t\\\tNONE\\\\\t-1\\\\\\\t\\\\\\\\\t\\\\\\\\\\\t\\\\\\\\\\\\\t\\\\\\\\\\\\\\\tnull;\\\\\\\\\\\\\\\\\t-1\\\\\\\\\\\\\\\\\\\tCardsLayers\\\\\\\\\\\\\\\\\\\\\t\\\\\\\\\\\\\\\\\\\\\\\tnull;2543;244;0`
            )

        this.downloadVassalDeckWithTempLink(powers, `${name}_POWERS.txt`)
    }

    downloadVassalDeckWithTempLink = (deck, fileName) => {
        const tempDownloadLink = document.createElement('a')
        tempDownloadLink.style.display = 'none'
        document.body.appendChild(tempDownloadLink)

        const content = ['DECK\t\r', ...deck]

        const file = new Blob(content, { type: 'text/plain' })
        tempDownloadLink.href = URL.createObjectURL(file)
        tempDownloadLink.download = fileName
        tempDownloadLink.click()

        document.body.removeChild(tempDownloadLink)
    }

    _handleSaveText = link => {
        const { id, name, cards } = this.props
        let newLineChar
        if (navigator.platform.startsWith('Win')) {
            newLineChar = '\r\n'
        } else {
            newLineChar = '\n'
        }

        const header = `Faction: ${
            factions[idPrefixToFaction[id.split('-')[0]]]
        }`
        const cardsjs = cards.toJS()
        const objectives = cardsjs.filter(c => c.type === 0)
        const totalGlory = objectives.reduce(
            (acc, c) => (acc += Number(c.glory)),
            0
        )
        const objectivesAsText = objectives
            .map(
                c =>
                    `${this._convertCardIdToPrintFormat(c.id)}${` - `}${
                        c.name
                    }${` - `}${c.glory} glory${newLineChar}`
            )
            .reduce((acc, el) => (acc += el), '')
        const objectivesSection = `Objectives - Total glory: ${totalGlory}${newLineChar}-----------------------------${newLineChar}${objectivesAsText}`

        const gambits = cardsjs.filter(c => c.type === 1 || c.type === 3)
        const gambitsAsText = gambits
            .map(
                c =>
                    `${this._convertCardIdToPrintFormat(c.id)}${` - `}${
                        c.name
                    }${newLineChar}`
            )
            .reduce((acc, el) => (acc += el), '')
        const gambitsSection = `Gambits (${gambits.length})${newLineChar}-----------------------------${newLineChar}${gambitsAsText}`

        const upgrades = cardsjs.filter(c => c.type === 2)
        const upgradesAsText = upgrades
            .map(
                c =>
                    `${this._convertCardIdToPrintFormat(c.id)}${` - `}${
                        c.name
                    }${newLineChar}`
            )
            .reduce((acc, el) => (acc += el), '')
        const upgradesSection = `Upgrades (${upgrades.length})${newLineChar}-----------------------------${newLineChar}${upgradesAsText}`

        const location = window.location.href.endsWith(id)
            ? window.location.href
            : `${window.location.href}view/deck/${id}`
        const footer = `-----------------------------${newLineChar}Deck URL: ${location}`

        const content = [
            header,
            `${newLineChar}${newLineChar}`,
            objectivesSection,
            `${newLineChar}${newLineChar}`,
            gambitsSection,
            `${newLineChar}${newLineChar}`,
            upgradesSection,
            `${newLineChar}${newLineChar}`,
            footer,
        ]
        const file = new Blob(content, { type: 'text/plain' })
        link.href = URL.createObjectURL(file)
        link.download = `${name}.txt`
    }

    _handleSaveImage = link => {
        const { cards, name } = this.props

        const canvas = document.getElementById('deckCanvas')
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = 'white'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        const objectives = cards
            .toJS()
            .filter(c => c.type === 0)
            .reduce((acc, el, i, arr) => {
                if (i % 4 === 0) {
                    acc.push(arr.slice(i, i + 4))
                }
                return acc
            }, [])

        const gambits = cards
            .toJS()
            .filter(c => c.type === 1 || c.type === 3)
            .reduce((acc, el, i, arr) => {
                if (i % 4 === 0) {
                    acc.push(arr.slice(i, i + 4))
                }
                return acc
            }, [])

        const upgrades = cards
            .toJS()
            .filter(c => c.type === 2)
            .reduce((acc, el, i, arr) => {
                if (i % 4 === 0) {
                    acc.push(arr.slice(i, i + 4))
                }
                return acc
            }, [])

        try {
            let cursorX = 10
            let cursorY = 10
            for (let row of objectives) {
                for (let c of row) {
                    if (restrictedCards[c.id]) {
                        ctx.fillStyle = 'Goldenrod'
                        ctx.fillRect(
                            cursorX - 5,
                            cursorY - 5,
                            cardWidthPx + 10,
                            cardHeightPx + 10
                        )
                    }

                    const image = document.getElementById(`card_${c.id}`)
                    ctx.drawImage(
                        image,
                        cursorX,
                        cursorY,
                        cardWidthPx,
                        cardHeightPx
                    )
                    cursorX += cardWidthPx + 10
                }

                cursorX = 10
                cursorY += cardHeightPx + 10
            }

            ctx.beginPath()
            ctx.moveTo(4 * (cardWidthPx + 10) + 10, 5)
            ctx.lineTo(
                4 * (cardWidthPx + 10) + 10,
                3 * (cardHeightPx + 10) + 10
            )
            ctx.stroke()

            cursorY = 10
            cursorX = 4 * (cardWidthPx + 10) + 21
            for (let row of gambits) {
                for (let c of row) {
                    if (restrictedCards[c.id]) {
                        ctx.fillStyle = 'Goldenrod'
                        ctx.fillRect(
                            cursorX - 5,
                            cursorY - 5,
                            cardWidthPx + 10,
                            cardHeightPx + 10
                        )
                    }

                    const image = document.getElementById(`card_${c.id}`)
                    ctx.drawImage(
                        image,
                        cursorX,
                        cursorY,
                        cardWidthPx,
                        cardHeightPx
                    )
                    cursorX += cardWidthPx + 10
                }

                cursorX = 4 * (cardWidthPx + 10) + 21
                cursorY += cardHeightPx + 10
            }

            ctx.beginPath()
            ctx.moveTo(8 * (cardWidthPx + 10) + 20, 5)
            ctx.lineTo(
                8 * (cardWidthPx + 10) + 20,
                3 * (cardHeightPx + 10) + 10
            )
            ctx.stroke()

            cursorY = 10
            cursorX = 8 * (cardWidthPx + 10) + 31
            for (let row of upgrades) {
                for (let c of row) {
                    if (restrictedCards[c.id]) {
                        ctx.fillStyle = 'Goldenrod'
                        ctx.fillRect(
                            cursorX - 5,
                            cursorY - 5,
                            cardWidthPx + 10,
                            cardHeightPx + 10
                        )
                    }

                    const image = document.getElementById(`card_${c.id}`)
                    ctx.drawImage(
                        image,
                        cursorX,
                        cursorY,
                        cardWidthPx,
                        cardHeightPx
                    )
                    cursorX += cardWidthPx + 10
                }

                cursorX = 8 * (cardWidthPx + 10) + 31
                cursorY += cardHeightPx + 10
            }

            const dataUrl = canvas.toDataURL()
            const contentType = 'image/png'
            const b64Data = dataUrl.slice('data:image/png;base64,'.length)
            const blob = b64toBlob(b64Data, contentType)
            link.href = URL.createObjectURL(blob)
            link.download = `${name}.png`
        } catch (err) {
            console.error(err)
        }
    }

    _convertCardIdToPrintFormat = cardId => {
        switch (cardId.slice(0, 2)) {
            case '02':
                return `L${cardId.slice(-3)}`
            case '03':
                return `N${cardId.slice(-3)}`
            default:
                return cardId.slice(-3)
        }
    }

    _handleExportToUDB = () => {
        const encodeToUDB = card => {
            if (card.startsWith('02')) return `L${Number(card.slice(-3))}`
            if (card.startsWith('03')) return `N${Number(card.slice(-3))}`
            if (card.startsWith('04')) return `P${Number(card.slice(-3))}`
            if (card.startsWith('05')) return `D${Number(card.slice(-3))}`
            if (card.startsWith('06')) return `B${Number(card.slice(-3))}`
            if (card.startsWith('07')) return `G${Number(card.slice(-3))}`

            return Number(card.slice(-3))
        }

        const udbEncodedCards = this.props.cards
            .toJS()
            .map(card => card.id)
            .map(encodeToUDB)
            .sort()
            .join()
        window.open(
            `https://www.underworldsdb.com/shared.php?deck=0,${udbEncodedCards}`
        )
    }

    _handleExportToClub = () => {
        const objectives = this.props.cards.toJS().filter(c => c.type === 0).map(c => c.id);
        const powers = this.props.cards.toJS().filter(c => c.type !== 0).map(c => c.id);
        const deck = JSON.stringify([objectives, powers]);
        clipboard.writeText(deck);
    }

    _handleExportToUDS = () => {
        const encodeToUDS = card => {
            if (card.startsWith('02')) return `${1000 + Number(card.slice(-3))}`
            if (card.startsWith('03')) return `${2000 + Number(card.slice(-3))}`
            if (card.startsWith('04')) return `${3000 + Number(card.slice(-3))}`
            if (card.startsWith('05')) return `${4000 + Number(card.slice(-3))}`
            if (card.startsWith('06')) return `${5000 + Number(card.slice(-3))}`
            if (card.startsWith('07')) return `${6000 + Number(card.slice(-3))}`

            return `${Number(card.slice(-3))}`
        }

        const udsEncodedCards = this.props.cards
            .toJS()
            .map(card => card.id)
            .map(encodeToUDS)
            .sort()
            .join()
        window.open(
            `https://www.underworlds-deckers.com/en/tournament-decks/?Deck=https://yawudb.com/cards,${udsEncodedCards}`
        )
    }

    _handleExportToGamesAssistant = () => {
        this.props.history.push(ROUTES.GAME_ASSISTANT, {
            cards: this.props.cards.toJS(),
            factionId: this.props.factionId,
            name: this.props.name,
        })
    }
}

const mapDispatchToProps = dispatch => {
    return {
        addCard: card => dispatch({ type: EDIT_ADD_CARD, card: card }),
        setName: name => dispatch({ type: EDIT_DECK_NAME, name: name }),
        setDescription: desc =>
            dispatch({ type: EDIT_DECK_DESCRIPTION, desc: desc }),
        setFaction: (faction, defaultSet) =>
            dispatch({
                type: EDIT_FACTION,
                faction: faction,
                defaultSet: defaultSet,
            }),
        setEditModeSets: value =>
            dispatch({ type: SET_EDIT_MODE_SETS, payload: value }),
        resetDeck: () => dispatch({ type: EDIT_RESET_DECK }),
    }
}

export default connect(
    null,
    mapDispatchToProps
)(withRouter(withStyles(styles)(ReadonlyDeck)))
