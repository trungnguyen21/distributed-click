import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PressButton from "./components/PressButton";
import CounterLabel from "./components/CounterLabel";
import { SERVER_ENDPOINT, WEBSOCKET_ENDPOINT } from "./constant";

const App: React.FC = () => {
	const [count, setCount] = useState<number>(0);
	const [isInitialized, setIsInitialized] = useState(false);

	useEffect(() => {
		const socket = new WebSocket(WEBSOCKET_ENDPOINT);

		socket.onopen = () => {
			console.log("Connected to Infrastructure");
			setIsInitialized(true); // <--- This reveals the counter!
		};

		socket.onmessage = (event) => {
			// Ensure we handle the data type correctly
			const newCount = parseInt(event.data);
			if (!isNaN(newCount)) {
				setCount(newCount);
			}
		};

		socket.onerror = (error) => {
			console.error("WebSocket Error:", error);
			setIsInitialized(false);
		};

		socket.onclose = () => {
			console.log("Connection closed");
			setIsInitialized(false);
		};

		return () => {
			socket.close();
		};
	}, []);

	const handlePress = useCallback(async () => {
		try {
			await fetch(SERVER_ENDPOINT + "/press", {
				method: "POST",
			});
		} catch (error) {
			console.error("You crashed the app :( ", error);
		}
	}, []);

	return (
		<div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-[#000000] overflow-hidden selection:bg-green-500 selection:text-black">
			{/* CRT Scanline and Overlay */}
			<div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
				<div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.05)_50%),linear-gradient(90deg,rgba(255,0,0,0.01),rgba(0,255,0,0.01),rgba(0,0,255,0.01))] bg-[length:100%_4px,3px_100%]" />
				<div className="absolute inset-0 animate-scanline bg-gradient-to-b from-transparent via-green-500/5 to-transparent h-full w-full -top-full" />
			</div>

			<main className="relative z-10 flex flex-col items-center gap-16">
				<PressButton onPress={handlePress} />

				<div className="h-32 flex items-center justify-center">
					<AnimatePresence mode="wait">
						{isInitialized ? (
							<CounterLabel value={count} key="count-display" />
						) : (
							<motion.div
								key="loading"
								initial={{ opacity: 0 }}
								animate={{ opacity: 0.5 }}
								exit={{ opacity: 0 }}
								className="text-green-500 font-mono text-sm tracking-[0.5em] animate-pulse"
							>
								CONNECTING...
							</motion.div>
						)}
					</AnimatePresence>
				</div>
			</main>

			{/* Subtle corner elements */}
			<div className="absolute top-6 left-6 opacity-20 font-mono text-[9px] text-green-500 hidden sm:block">
				TERMINAL_v2.0.1 // STATUS_OK
			</div>
			<div className="absolute bottom-6 right-6 opacity-20 font-mono text-[9px] text-green-500 hidden sm:block">
				LOCAL_CACHE_ACTIVE
			</div>

			<style>{`
        @keyframes scanline {
          0% { transform: translateY(0); }
          100% { transform: translateY(200%); }
        }
        .animate-scanline {
          animation: scanline 10s linear infinite;
        }
      `}</style>
		</div>
	);
};

export default App;
