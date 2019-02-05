import React, { Component, PureComponent } from 'react';
import IconButton from '@material-ui/core/IconButton';
import AddIcon from '@material-ui/icons/Add';
import { withStyles } from '@material-ui/core/styles';

class AddNewDeckButton extends PureComponent {
    render() {
        const { classes } = this.props;

        return(
            <div className={classes.root}>
                <img src={`/assets/icons/${this.props.faction}-deck.png`} className={classes.img} />
                <IconButton onClick={this._handleClick} className={classes.addBtn}>
                    <AddIcon />
                </IconButton>
            </div>
        );
    }

    _handleClick = () => {
        this.props.onClickAdd(this.props.faction);
    }
}

const styles = theme => ({
    root: {
        position: 'relative',
    },

    img: {
        width: '4rem', 
        height: '4rem', 
        marginRight: '.5rem',
    },

    addBtn: {
        position: 'absolute', 
        right: '.4rem',
        bottom: 0,
        border: '2px solid white', 
        width: "2rem", 
        height:'2rem', 
        borderRadius:'1rem',
        color: 'white',
        display: 'flex',
        backgroundColor: '#3B9979',
        padding: 0, 
        '&:hover': {
            backgroundColor: '#3B9979',
            // Reset on touch devices, it doesn't add specificity
            '@media (hover: none)': {
              backgroundColor: '#3B9979',
            },
          },
    }
});

export default withStyles(styles)(AddNewDeckButton);