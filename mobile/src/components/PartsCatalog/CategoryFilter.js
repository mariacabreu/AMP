import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';

const CategoryFilter = ({ categories, selectedCategory, onSelectCategory }) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.categoriesContainer}
    >
      {categories.map((cat, index) => (
        <TouchableOpacity
          key={index}
          style={[styles.categoryButton, selectedCategory === cat && styles.categoryButtonActive]}
          onPress={() => onSelectCategory(cat)}
        >
          <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextActive]}>
            {cat}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  categoriesContainer: {
    marginBottom: 20,
    ...Platform.select({
      web: {
        overflowX: 'auto',
        overflowY: 'hidden',
        whiteSpace: 'nowrap',
      }
    })
  },
  categoryButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#2c2c2c',
    height: 40,
    justifyContent: 'center',
    ...Platform.select({
      web: {
        display: 'inline-flex',
      }
    })
  },
  categoryButtonActive: {
    backgroundColor: '#2c2c2c',
  },
  categoryText: {
    fontSize: 12,
    color: '#2c2c2c',
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#fff',
  },
});

export default CategoryFilter;