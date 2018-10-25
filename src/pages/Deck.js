import React, { Component } from 'react';
import { db } from '../firebase';
import { ReadonlyDeck } from '../components/Deck';
import { OrderedSet } from 'immutable';
import { cardsDb, warbandsWithDefaultSet, idPrefixToFaction, PREFIX_LENGTH } from '../data/index';
import { CircularProgress } from '@material-ui/core';
import EditIcon from '@material-ui/icons/Edit';
import { connect } from 'react-redux';
import FloatingActionButton from '../components/FloatingActionButton';
import { withRouter } from 'react-router-dom';
import { ADD_CARD, SET_FACTION, CHANGE_NAME, CHANGE_DESCRIPTION } from '../reducers/deckUnderBuild';
import { SET_SETS } from '../reducers/cardLibraryFilters';


class Deck extends Component {
    state = {
        deck: null,
        isEditAllowed: false
    }

    async componentDidMount() {
        try {
            const deckRef = await db.collection('decks').doc(this.props.match.params.id).get();
            const data = deckRef.data();
    
            if(data.author !== 'Anonymous') {
                this.setState({ isEditAllowed: this.props.uid === data.author });
            }
    
            const created = data.created.toDate();
            this.setState({deck: {...data, id: this.props.match.params.id, created: created}}); //, author:this.props.userInfo.displayName
        } catch(error) {
            console.log(error);
        }
    }

    render() {
        if(!this.state.deck) {
            return (
                <div style={{display: 'flex', height: '100vh'}}>
                    <div style={{margin: 'auto', display: 'flex', flexFlow: 'column nowrap', alignItems: 'center'}}>
                        <CircularProgress style={{color: '#3B9979'}} />
                        <div>Fetching last added deck...</div>
                    </div>
                </div>
            );
        }

        const { id, name, cards, sets, created } = this.state.deck;
        return(
            <div style={{display: 'flex', flexFlow: 'column nowrap'}}>
                {/* <div style={{margin: '1rem auto 2rem auto', fontSize: '2rem'}}>Last added deck:</div> */}
                <ReadonlyDeck name={name} created={created} sets={sets} factionId={id.substr(0, id.length - 13)} cards={new OrderedSet(cards.map(c => ({id: c, ...cardsDb[c]})))} />
                {
                    this.state.isEditAllowed && (
                        <FloatingActionButton isEnabled onClick={this._editDeck}>
                            <EditIcon />
                        </FloatingActionButton>
                    )
                }
            </div>
        );
    }

    _editDeck = () => {
        const { id, name, cards, sets, desc } = this.state.deck;
        const strippedId = id.substring(0, id.length - 13);
        const faction = strippedId.length > PREFIX_LENGTH ? strippedId : idPrefixToFaction[strippedId];
        const defaultSet = warbandsWithDefaultSet.filter(a => a.includes(faction));
        this.props.setFaction(faction, defaultSet[0][1]);
        this.props.setSets(sets);
        for(let c of cards) {
            this.props.addCard(c);
        }
        
        this.props.setName(name);
        this.props.setDescription(desc);
        this.props.history.push(`/deck/edit/${id}`);
    }

}

const mapStateToProps = state => {
    return {
        uid: state.auth.uid
    }
}

const mapDispatchToProps = dispatch => {
    return {
        addCard: card => dispatch({ type: ADD_CARD, card: card}),
        setName: name => dispatch({ type: CHANGE_NAME, name: name}),
        setDescription: desc => dispatch({ type: CHANGE_DESCRIPTION, desc: desc }),
        setFaction: (faction, defaultSet) => dispatch({ type: SET_FACTION, faction: faction, defaultSet: defaultSet }),
        setSets: sets => dispatch({ type: SET_SETS, payload: sets })
    }
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Deck));