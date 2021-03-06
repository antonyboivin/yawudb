import { createSlice } from "@reduxjs/toolkit";
import toPairs from 'lodash/toPairs';

const privateDecksSlice = createSlice({
    name: 'privateDecks',
    initialState: {},
    reducers: {
        addDecks(state, action) {
            Object.assign(state, action.payload);
        },
        addDeck(state, action) {
            const { id, data } = action.payload;
            state[id] = data;
        },
        deleteDeck(state,action) {
            console.log('delete in reducer');
            delete state[action.payload];
        },
        togglePublicVisibility(state, action) {
            const deck = state[action.payload];
            deck.private = !deck.private;
        }
    }
});

export const { addDeck, addDecks, deleteDeck, togglePublicVisibility } = privateDecksSlice.actions;

export const fetchDecksFromDatabase = firebase => async (dispatch, getState) => {
    try {
        const { auth } = getState();
        if(!auth) return;
        const snapshot = await firebase.realdb.ref('decks').orderByChild('author').equalTo(auth.uid).once('value');
        const decks = snapshot.val();
        if(decks) {
            const withFixedDate = toPairs(decks).reduce((res, [id, value]) => {
                let created = new Date(0);
                if(value.created && value.created.seconds) {
                    created.setSeconds(value.created.seconds);
                } else {
                    created = new Date(value.created);
                }

                return { ...res, [id]: { ...value, created }}
            }, {})

            dispatch(addDecks(withFixedDate));
        }
    } catch (error) {   
        console.error('Something went wrong', error);
    }
}

export const deletePrivateDeck = (firebase, id) => async (dispatch, getState) => {
    try {
        // await firebase.realdb.ref(`/decks/${id}`).remove()
        // console.log('ping', id)

        // await firebase.decksMetaDb().doc('all').update({
        //     ids: firebase.firestoreArrayRemove(id)
        // });

        // await firebase.decksMetaDb().doc(id.split('-')[0]).update({
        //     ids: firebase.firestoreArrayRemove(id)
        // });

        const { auth } = getState();
        if(auth) {
            // await firebase.db.collection('users').doc(auth.uid).update({
            //     mydecks: firebase.firestoreArrayRemove(id)
            // });

            dispatch(deleteDeck(id))
        }
    } catch (error) {
        console.error('Something went wrong', error);
    }
}

export default privateDecksSlice.reducer;