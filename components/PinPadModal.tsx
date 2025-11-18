import React, { useState, useEffect } from 'react';

interface PinPadModalProps {
    isOpen: boolean;
    onClose: () => void;
    correctPin: string;
    onSuccess: () => void;
    moduleName: string;
}

const PinPadModal: React.FC<PinPadModalProps> = ({ isOpen, onClose, correctPin, onSuccess, moduleName }) => {
    const [pin, setPin] = useState('');
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setPin('');
            setError(false);
        }
    }, [isOpen]);

    const handleKeyPress = (key: string) => {
        if (error) {
            setPin(key);
            setError(false);
            return;
        }
        if (pin.length < 4) {
            setPin(prev => prev + key);
        }
    };
    
    useEffect(() => {
        if (pin.length === 4) {
            if (pin === correctPin) {
                onSuccess();
            } else {
                setError(true);
            }
        }
    }, [pin, correctPin, onSuccess]);


    const handleDelete = () => {
        setPin(pin.slice(0, -1));
        setError(false);
    };

    const pinDots = Array(4).fill(0).map((_, i) => (
        <div key={i} className={`w-4 h-4 rounded-full transition-colors ${i < pin.length ? (error ? 'bg-red-500' : 'bg-purple-400') : 'bg-gray-600'}`}></div>
    ));

    const numberButtons = ['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
        <button key={num} onClick={() => handleKeyPress(num)} className="h-14 bg-gray-700 rounded-full text-xl font-bold text-white active:bg-gray-600">
            {num}
        </button>
    ));

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-[70] p-4" onClick={onClose}>
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 w-full max-w-xs shadow-2xl shadow-purple-500/20" onClick={e => e.stopPropagation()}>
                <h2 className="text-lg font-bold text-center text-purple-300">Desbloquear {moduleName}</h2>
                <p className="text-sm text-center text-gray-400 mb-2">Ingresa el PIN para continuar</p>
                <div className={`flex justify-center gap-4 ${error ? 'animate-shake' : ''}`}>{pinDots}</div>
                <p className="text-sm text-center text-red-400 h-5 mb-2">{error ? 'PIN incorrecto' : ''}</p>
                
                <div className="grid grid-cols-3 gap-3">
                    {numberButtons}
                    <div />
                    <button onClick={() => handleKeyPress('0')} className="h-14 bg-gray-700 rounded-full text-xl font-bold text-white active:bg-gray-600">0</button>
                    <button onClick={handleDelete} className="h-14 bg-gray-700 rounded-full text-xl font-bold text-white active:bg-gray-600 flex items-center justify-center">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
                        </svg>
                    </button>
                </div>
            </div>
             <style>{`
                @keyframes shake {
                  10%, 90% { transform: translate3d(-1px, 0, 0); }
                  20%, 80% { transform: translate3d(2px, 0, 0); }
                  30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
                  40%, 60% { transform: translate3d(4px, 0, 0); }
                }
                .animate-shake {
                  animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
                }
            `}</style>
        </div>
    );
};

export default PinPadModal;