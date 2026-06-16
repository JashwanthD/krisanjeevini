import os
import sys
import numpy as np
import tensorflow as tf

def generate_tflite_model():
    print("Generating MobileNetV2 TFLite model...")
    # Base model from Keras applications (no top)
    base_model = tf.keras.applications.MobileNetV2(
        input_shape=(224, 224, 3),
        include_top=False,
        weights='imagenet'
    )
    # Add new top layer for 3 classes
    x = tf.keras.layers.GlobalAveragePooling2D()(base_model.output)
    output = tf.keras.layers.Dense(3, activation='softmax')(x)
    model = tf.keras.models.Model(inputs=base_model.input, outputs=output)
    
    # Convert to TFLite with default optimization (dynamic range quantization)
    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    converter.optimizations = [tf.lite.Optimize.DEFAULT]
    tflite_model = converter.convert()
    
    os.makedirs('public/models', exist_ok=True)
    with open('public/models/leaf_pathology.tflite', 'wb') as f:
        f.write(tflite_model)
    print("Saved public/models/leaf_pathology.tflite")

def generate_sowing_ensemble():
    print("Generating sowing_ensemble.pkl...")
    from sklearn.ensemble import RandomForestClassifier, VotingClassifier
    from xgboost import XGBClassifier
    import joblib
        
    # Generate dummy data: N, P, K, temp, humidity, rainfall, pH
    X = np.random.rand(100, 7) * [150, 150, 150, 45, 100, 300, 14]
    y = np.random.randint(0, 21, 100) # 21 crop classes
    
    rf = RandomForestClassifier(n_estimators=10, random_state=42)
    xgb = XGBClassifier(n_estimators=10, random_state=42)
    ensemble = VotingClassifier(estimators=[('rf', rf), ('xgb', xgb)], voting='soft')
    ensemble.fit(X, y)
    
    os.makedirs('backend/weights', exist_ok=True)
    joblib.dump(ensemble, 'backend/weights/sowing_ensemble.pkl')
    print("Saved backend/weights/sowing_ensemble.pkl")

def generate_market_lstm():
    print("Generating market_lstm.h5...")
    model = tf.keras.Sequential([
        tf.keras.layers.InputLayer(shape=(30, 1)),
        tf.keras.layers.LSTM(16),
        tf.keras.layers.Dense(1)
    ])
    model.compile(optimizer='adam', loss='mse')
    
    X = np.random.rand(10, 30, 1)
    y = np.random.rand(10, 1)
    model.fit(X, y, epochs=1, verbose=0)
    
    os.makedirs('backend/weights', exist_ok=True)
    model.save('backend/weights/market_lstm.h5')
    print("Saved backend/weights/market_lstm.h5")

def generate_icons():
    print("Generating PWA icons...")
    from PIL import Image, ImageDraw
    
    os.makedirs('public/icons', exist_ok=True)
    
    for size in [192, 512]:
        img = Image.new('RGBA', (size, size), color='#1B5E20')
        d = ImageDraw.Draw(img)
        radius = size // 3
        center = size // 2
        d.ellipse([center - radius, center - radius, center + radius, center + radius], fill='#4CAF50')
        img.save(f'public/icons/icon-{size}x{size}.png')
        print(f"Saved public/icons/icon-{size}x{size}.png")

if __name__ == "__main__":
    generate_tflite_model()
    generate_sowing_ensemble()
    generate_market_lstm()
    generate_icons()
