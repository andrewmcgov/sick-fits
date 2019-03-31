import React, { Component } from 'react';
import styles from 'styled-components';
import PropTypes from 'prop-types';
import formatMoney from '../lib/formatMoney';
import RemoveFromCart from './RemoveFromCart';

const CartItemStyles = styles.li`
  padding: 1rem 0;
  border-bottom: 1px solid ${props => props.theme.lightgrey};
  display: grid;
  align-items: center;
  grid-template-columns: auto 1fr auto;
  img {
    margin-right: 10px;
  }
  h3,
  p {
    margin: 0;
  }
`;

const CartItem = props => {
  const { cartItem } = props;
  // Check if the item exists
  if (!cartItem.item) return <p>This item has been removed</p>;
  const { image, title, price } = cartItem.item;
  return (
    <CartItemStyles>
      <img width="100" src={image} alt={title} />
      <div className="cart-item-details">
        <h3>{title}</h3>
        <p>{formatMoney(price * cartItem.quantity)}</p>
        {' - '}
        <em>
          {cartItem.quantity} &times; {formatMoney(price)} each
        </em>
      </div>
      <RemoveFromCart id={cartItem.id} />
    </CartItemStyles>
  );
};

CartItem.propTypes = {
  cartItem: PropTypes.object.isRequired
};

export default CartItem;
