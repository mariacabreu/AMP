package com.anonymous.ampmobile

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.chaquo.python.Python
import com.chaquo.python.android.AndroidPlatform
import java.util.concurrent.atomic.AtomicBoolean
import android.util.Log

class FlaskServerModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    companion object {
        private const val TAG = "FlaskServer"
    }

    private val serverRunning = AtomicBoolean(false)
    private var serverThread: Thread? = null

    override fun getName(): String {
        return "FlaskServer"
    }

    @ReactMethod
    fun startServer() {
        if (serverRunning.get()) {
            Log.d(TAG, "Servidor já está rodando!")
            return
        }

        Log.d(TAG, "Iniciando servidor Flask...")
        serverThread = Thread {
            try {
                if (!Python.isStarted()) {
                    Log.d(TAG, "Inicializando Chaquopy...")
                    AndroidPlatform.initialize(reactApplicationContext)
                }
                val python = Python.getInstance()
                val appModule = python.getModule("app")
                serverRunning.set(true)
                appModule.callAttr("start_server")
            } catch (e: Exception) {
                Log.e(TAG, "Erro no servidor Flask", e)
                serverRunning.set(false)
            }
        }
        serverThread?.start()
    }

    @ReactMethod
    fun stopServer() {
        Log.d(TAG, "Parando servidor Flask...")
        serverRunning.set(false)
        serverThread?.interrupt()
        serverThread = null
    }
}
