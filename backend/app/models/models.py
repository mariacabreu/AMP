from app import db


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    is_premium = db.Column(db.Boolean, default=False)
    plan_type = db.Column(db.String(20), default='free')
    reminder_frequency = db.Column(db.String(50), default='biweekly')
    phone = db.Column(db.String(20), nullable=True)
    avatar = db.Column(db.Text, nullable=True)  # Base64 encoded image or URL
    vehicles = db.relationship('Vehicle', backref='owner', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'full_name': self.full_name,
            'email': self.email,
            'phone': self.phone,
            'is_premium': self.is_premium,
            'plan_type': self.plan_type,
            'reminder_frequency': self.reminder_frequency,
            'avatar_url': self.avatar,
            'avatar': self.avatar
        }


class Vehicle(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    brand = db.Column(db.String(50), nullable=False)
    model = db.Column(db.String(50), nullable=False)
    year = db.Column(db.Integer, nullable=False)
    transmission = db.Column(db.String(20))
    mileage = db.Column(db.Integer)
    fuel_type = db.Column(db.String(20))
    engine_type = db.Column(db.String(50))
    usage_type = db.Column(db.String(50))
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    last_oil_change = db.Column(db.Integer, default=0)
    last_belt_change = db.Column(db.Integer, default=0)
    last_brake_change = db.Column(db.Integer, default=0)
    maintenance_history = db.relationship('MaintenanceHistory', backref='vehicle', lazy=True, cascade='all, delete-orphan')
    obd_scans = db.relationship('OBDScan', backref='vehicle', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'brand': self.brand,
            'model': self.model,
            'year': self.year,
            'transmission': self.transmission,
            'mileage': self.mileage,
            'fuel_type': self.fuel_type,
            'engine_type': self.engine_type,
            'usage_type': self.usage_type,
            'last_oil_change': self.last_oil_change,
            'last_belt_change': self.last_belt_change,
            'last_brake_change': self.last_brake_change,
            'maintenance_history': [h.to_dict() for h in self.maintenance_history]
        }


class MaintenanceHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    vehicle_id = db.Column(db.Integer, db.ForeignKey('vehicle.id'), nullable=False)
    item = db.Column(db.String(100), nullable=False)
    last_km = db.Column(db.Integer, nullable=False)
    last_date = db.Column(db.String(20))
    cost = db.Column(db.Float, default=0.0)
    liters = db.Column(db.Float, default=0.0)

    def to_dict(self):
        return {
            'id': self.id,
            'item': self.item,
            'last_km': self.last_km,
            'last_date': self.last_date,
            'cost': self.cost,
            'liters': self.liters
        }


class OBDScan(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    vehicle_id = db.Column(db.Integer, db.ForeignKey('vehicle.id'), nullable=False)
    scan_date = db.Column(db.String(50), nullable=False)
    dtc_codes = db.Column(db.JSON, default=[])
    live_data = db.Column(db.JSON, default={})
    connected_device = db.Column(db.String(100))

    def to_dict(self):
        return {
            'id': self.id,
            'vehicle_id': self.vehicle_id,
            'scan_date': self.scan_date,
            'dtc_codes': self.dtc_codes,
            'live_data': self.live_data,
            'connected_device': self.connected_device
        }

