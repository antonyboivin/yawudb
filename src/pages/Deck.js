import React from 'react'
import ReadonlyDeck from '../components/ReadonlyDeck/index'
import { OrderedSet } from 'immutable'
import {
    cardsDb,
    warbandsWithDefaultSet,
    idPrefixToFaction,
    factions,
    PREFIX_LENGTH,
} from '../data/index'
import { CircularProgress } from '@material-ui/core'
import EditIcon from '@material-ui/icons/Edit'
import { connect } from 'react-redux'
import FloatingActionButton from '../components/FloatingActionButton'
import { withRouter } from 'react-router-dom'
import {
    SET_EDIT_MODE_SETS,
    SET_CREATE_MODE_SETS,
} from '../reducers/cardLibraryFilters'
import {
    EDIT_ADD_CARD,
    EDIT_DECK_NAME,
    EDIT_DECK_DESCRIPTION,
    EDIT_FACTION,
    EDIT_RESET_DECK,
} from '../reducers/deckUnderEdit'
import {
    ADD_CARD,
    CHANGE_NAME,
    CHANGE_DESCRIPTION,
    SET_FACTION,
    RESET_DECK,
} from '../reducers/deckUnderBuild'
import { removeMyDeck } from '../reducers/mydecks'
import DeleteConfirmationDialog from '../atoms/DeleteConfirmationDialog'
import { withFirebase } from '../firebase'
import { Helmet } from 'react-helmet'

// const useStyles = makeStyles(theme => ({
//     viewAsBtn: {
//         display: 'none',
//         [theme.breakpoints.up('lg')]: {
//             display: 'flex',
//         },
//     },
// }))

function Deck(props) {
    const { location, match, history } = props
    const { firebase } = props

    const [deck, setDeck] = React.useState(null)
    const [isEditAllowed, setIsEditAllowed] = React.useState(false)
    const [isDeleteDialogVisible, setIsDeleteDialogVisible] = React.useState(
        false
    )
    const [cardsView, setCardsView] = React.useState(false)

    const { id, name, desc, cards, sets, created, authorDisplayName } =
        deck || {}
    const cardsSet = !cards
        ? new OrderedSet()
        : new OrderedSet(cards.map(c => ({ id: c, ...cardsDb[c] })))

    React.useEffect(() => {
        try {
            // console.log(location.state)
            if (props.mydecks[match.params.id]) {
                setDeck(props.mydecks[match.params.id])
                setIsEditAllowed(true)
            } else {
                if (location.state) {
                    setDeck({
                        ...location.state.deck,
                        id: match.params.id,
                    })
                    setIsEditAllowed(location.state.canUpdateOrDelete)
                }
            }

            firebase.deck(match.params.id).on('value', snapshot => {
                const data = snapshot.val()
                let author = data.author
                if (author !== 'Anonymous') {
                    setIsEditAllowed(props.uid === data.author)
                }

                let created = new Date(0)
                if (data.created && data.created.seconds) {
                    created.setSeconds(data.created.seconds)
                } else {
                    created = new Date(data.created)
                }

                setDeck({
                    ...data,
                    id: match.params.id,
                    created: created,
                })
            })
        } catch (error) {
            console.log(error)
        }

        return () => firebase.deck(match.params.id).off()
    }, [])

    const handleChangeView = () => {
        setCardsView(prev => !prev)
        // this.setState(state => ({ cardsView: !state.cardsView }))
    }

    const handleCloseDeleteDialog = () => {
        setIsDeleteDialogVisible(false)
        // this.setState({ isDeleteDialogVisible: false })
    }

    const handleDeleteDeck = async () => {
        try {
            console.log(props.uid)
            const { id } = deck
            firebase.deck(id).off()

            await firebase.realdb.ref(`/decks/${id}`).remove()

            props.firebase.decksMetaDb().doc('all').update({
                ids: props.firebase.firestoreArrayRemove(id)
            });

            props.firebase.decksMetaDb().doc(id.split('-')[0]).update({
                ids: props.firebase.firestoreArrayRemove(id)
            });

            if (props.uid) {
                props.removeDeck(id)

                firebase.db.collection('users').doc(props.uid).update({
                    mydecks: props.firebase.firestoreArrayRemove(id)
                });
            } else {
                const anonDeckIds =
                    JSON.parse(localStorage.getItem('yawudb_anon_deck_ids')) ||
                    []
                const updated = anonDeckIds.filter(deckId => deckId !== id)
                localStorage.setItem(
                    'yawudb_anon_deck_ids',
                    JSON.stringify(updated)
                )
            }

            handleCloseDeleteDialog()
            history.push('/mydecks')
        } catch (err) {
            console.error('ERROR deleting deck: ', err)
        }
    }

    const _editDeck = () => {
        props.resetDeck()
        const { id, name, cards, sets, desc } = deck
        const strippedId = id.substring(0, id.length - 13)
        const faction =
            strippedId.length > PREFIX_LENGTH
                ? strippedId
                : idPrefixToFaction[strippedId]
        const defaultSet = warbandsWithDefaultSet.filter(a =>
            a.includes(faction)
        )
        props.setFaction(faction, defaultSet[0][1])
        props.setEditModeSets(sets)
        if (cards) {
            for (let c of cards) {
                props.addCard(c)
            }
        }

        props.setName(name)
        props.setDescription(desc)
        history.push(`/deck/edit/${id}`)
    }

    const _deleteDeck = async () => {
        setIsDeleteDialogVisible(true)
    }

    const _copyDeck = () => {
        props.copyResetDeck()
        const { id, name, cards, sets } = deck
        const strippedId = id.substring(0, id.length - 13)
        const faction =
            strippedId.length > PREFIX_LENGTH
                ? strippedId
                : idPrefixToFaction[strippedId]
        const defaultSet = warbandsWithDefaultSet.filter(a =>
            a.includes(faction)
        )
        props.copySetFaction(faction, defaultSet[0][1])
        props.copyCreateModeSets(sets)
        if (cards) {
            for (let c of cards) {
                props.copyAddCard(c)
            }
        }

        props.copyChangeName(`${name} - COPY`)
        props.copyChangeDescription()
        history.push(`/deck/create`)
    }

    return !deck ? (
        <div style={{ display: 'flex', height: '100vh' }}>
            <div
                style={{
                    margin: 'auto',
                    display: 'flex',
                    flexFlow: 'column nowrap',
                    alignItems: 'center',
                }}
            >
                <CircularProgress style={{ color: '#3B9979' }} />
                <div>Fetching last added deck...</div>
            </div>
        </div>
    ) : (
        <React.Fragment>
            <Helmet>
                <title>
                    {`${
                        factions[
                            idPrefixToFaction[id.substr(0, id.length - 13)]
                        ]
                    } Deck for Warhammer Underworlds`}
                </title>
                <meta
                    name="description"
                    content={`Get inspired with this deck to build your next Grand Clash winning ${
                        factions[
                            idPrefixToFaction[id.substr(0, id.length - 13)]
                        ]
                    } deck.`}
                />
                <meta
                    property="og:title"
                    content={`${
                        factions[
                            idPrefixToFaction[id.substr(0, id.length - 13)]
                        ]
                    } Deck for Warhammer Underworlds`}
                />
                <meta
                    property="og:description"
                    content={`Get inspired with this deck to build your next Grand Clash winning ${
                        factions[
                            idPrefixToFaction[id.substr(0, id.length - 13)]
                        ]
                    } deck.`}
                />
                <meta property="og:type" content="website" />
                <meta
                    property="og:url"
                    content={`https://yawudb.com/view/deck/${id}`}
                />
                <meta
                    property="og:image"
                    content={`https://yawudb.com/assets/icons/${
                        idPrefixToFaction[id.substr(0, id.length - 13)]
                    }-deck.png`}
                />
            </Helmet>
            <div style={{ display: 'flex', flexFlow: 'column nowrap' }}>
                <ReadonlyDeck
                    onCardsViewChange={handleChangeView}
                    cardsView={cardsView}
                    id={id}
                    author={authorDisplayName}
                    name={name}
                    desc={desc}
                    created={created}
                    sets={sets}
                    factionId={id.substr(0, id.length - 13)}
                    cards={cardsSet}
                    canUpdateOrDelete={isEditAllowed}
                    onEdit={_editDeck}
                    onCopy={_copyDeck}
                    onDelete={_deleteDeck}
                />

                <DeleteConfirmationDialog
                    title="Delete deck"
                    description={`Are you sure you want to delete deck: '${name}'`}
                    open={isDeleteDialogVisible}
                    onCloseDialog={handleCloseDeleteDialog}
                    onDeleteConfirmed={handleDeleteDeck}
                    onDeleteRejected={handleCloseDeleteDialog}
                />

                {isEditAllowed && (
                    <FloatingActionButton isEnabled onClick={_editDeck}>
                        <EditIcon />
                    </FloatingActionButton>
                )}
            </div>
        </React.Fragment>
    )
}

const mapStateToProps = state => {
    return {
        uid: state.auth !== null ? state.auth.uid : null,
        mydecks: state.mydecks,
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
        removeDeck: id => dispatch(removeMyDeck(id)),

        copyAddCard: card => dispatch({ type: ADD_CARD, card: card }),
        copyChangeName: name => dispatch({ type: CHANGE_NAME, name: name }),
        copyChangeDescription: () =>
            dispatch({ type: CHANGE_DESCRIPTION, desc: '' }),
        copySetFaction: (faction, defaultSet) =>
            dispatch({
                type: SET_FACTION,
                faction: faction,
                defaultSet: defaultSet,
            }),
        copyCreateModeSets: value =>
            dispatch({ type: SET_CREATE_MODE_SETS, payload: value }),
        copyResetDeck: () => dispatch({ type: RESET_DECK }),
    }
}

export default withFirebase(
    withRouter(
        connect(
            mapStateToProps,
            mapDispatchToProps
        )(Deck)
    )
)
