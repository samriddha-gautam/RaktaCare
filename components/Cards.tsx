import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React from "react";


  const recentrequests = [
    { id: 1, title: 'A+', description: 'Required A+ blood asap in MediCity Hospital' },
    { id: 2, title: 'B+', description: 'Need B positive blood for my mother' },
    { id: 3, title: 'AB-', description: 'My dad needs AB- blood urgently please help!!' },
    { id: 4, title: 'AB-', description: 'My dad needs AB- blood urgently please help!!' },
    { id: 5, title: 'AB-', description: 'My dad needs AB- blood urgently please help!!' },


  ];

const Cards = () => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Recent Requests</Text>
      {recentrequests.map((request) => (
        <TouchableOpacity key={request.id} style={styles.recentCard} activeOpacity={0.8}>
          <View style={styles.recentImage} />
          <View style={styles.recentContent}>
            <Text style={styles.recentTitle}>{request.title}</Text>
            <Text style={styles.recentDescription}>{request.description}</Text>
            <Text style={styles.recentLocation}>Location</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default Cards;


const styles = StyleSheet.create({
  
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 20,
    marginBottom: 15,
  },
  recentCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 10,
    flexDirection: 'row',
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  recentImage: {
    width: 80,
    height: 80,
    backgroundColor: '#e9ecef',
    borderRadius: 8,
    marginRight: 15,
  },
  recentContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  recentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  recentDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  recentLocation: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginTop: 5,
  }
});
