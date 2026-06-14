#![no_std]
use soroban_sdk::{contract, contractimpl, Symbol};

const COUNTER: Symbol = Symbol::short("COUNTER");

#[contract]
pub struct CounterContract;

#[contractimpl]
impl CounterContract {
    /// Initialize the counter with a starting value
    pub fn init(env: soroban_sdk::Env, initial_value: u32) {
        env.storage().instance().set(&COUNTER, &initial_value);
    }

    /// Get the current counter value
    pub fn get(env: soroban_sdk::Env) -> u32 {
        env.storage()
            .instance()
            .get(&COUNTER)
            .unwrap_or(0)
    }

    /// Increment the counter by 1
    pub fn increment(env: soroban_sdk::Env) -> u32 {
        let mut count = Self::get(env.clone());
        count += 1;
        env.storage().instance().set(&COUNTER, &count);
        count
    }

    /// Decrement the counter by 1
    pub fn decrement(env: soroban_sdk::Env) -> u32 {
        let mut count = Self::get(env.clone());
        if count > 0 {
            count -= 1;
        }
        env.storage().instance().set(&COUNTER, &count);
        count
    }

    /// Add a specific value to the counter
    pub fn add(env: soroban_sdk::Env, value: u32) -> u32 {
        let mut count = Self::get(env.clone());
        count += value;
        env.storage().instance().set(&COUNTER, &count);
        count
    }

    /// Reset the counter to zero
    pub fn reset(env: soroban_sdk::Env) {
        env.storage().instance().set(&COUNTER, &0);
    }
}
